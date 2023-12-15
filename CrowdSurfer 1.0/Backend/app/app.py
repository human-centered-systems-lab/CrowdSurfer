import datetime
from datetime import timedelta
from flask import Flask, request, make_response, jsonify, render_template
from pymongo import MongoClient
from bson.json_util import dumps, loads
from dotenv import load_dotenv
import os

app = Flask(__name__)
app.debug = True
load_dotenv()

# Configuration for MongoDB
mongo_client = MongoClient(os.getenv('MONGO_URI'))


def add_cors_headers(response):
    # Add CORS headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE'
    return response


@app.after_request
def after_request(response):
    path = request.path
    if path in ["/", "/demo", "/success"]:
        return response
    else:
        return add_cors_headers(response)


@app.route('/demo')
def demo():
    return render_template("demoTask.html")


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/success')
def success():
    return render_template("success.html")


@app.route('/login', methods=['POST'])
def login():
    json_in = request.get_json()
    prolific_id = json_in['prolific_id']
    db = mongo_client['CrowdSurfer']
    records = db['user']
    records_msg = db['message']
    check = records.count_documents({'prolific_id': prolific_id})
    if check == 0:
        new_register = {
            'prolific_id': prolific_id,
            'timestamp': datetime.datetime.now().strftime('%c'),
            'confirmed': 'false',
            'message': 'false',
        }
        records.insert_one(new_register)
        new_register_msg = {
            'prolific_id': prolific_id,
            'message': 'false',
            'text': '',
            'href': '',
        }
        records_msg.insert_one(new_register_msg)

    response = {
        'status': 'success',
    }
    return make_response(jsonify(response)), 200


@app.route('/confirm', methods=['POST'])
def confirm():
    json_in = request.get_json()
    prolific_id = json_in['prolific_id']
    db = mongo_client['CrowdSurfer']
    records = db['user']
    check = records.count_documents({'prolific_id': prolific_id})
    if check != 0:
        records.update_one({'prolific_id': prolific_id}, {'$set': {'confirmed': 'true'}})
        response = {
            'status': 'success',
        }
    else:
        response = {
            'status': 'error',
        }
    return make_response(jsonify(response)), 200


@app.route('/checkConfirm', methods=['POST'])
def check_confirm():
    json_in = request.get_json()
    prolific_id = json_in['prolific_id']
    db = mongo_client['CrowdSurfer']
    records = db['user']
    check = records.count_documents({'prolific_id': prolific_id, 'confirmed': 'true'})
    if check != 0:
        response = {
            'status': 'success',
            'message': 'confirmed'
        }
    else:
        response = {
            'status': 'success',
            'message': 'not confirmed'
        }
    return make_response(jsonify(response)), 200


@app.route('/feedback', methods=['POST'])
def feedback():
    json_in = request.get_json()
    prolific_id = json_in['prolific_id']
    type_feedback = json_in['type']
    feedback_id = json_in['feedback_id']
    status = json_in['stat']
    url = json_in['url']
    db = mongo_client['CrowdSurfer']
    records = db['feedback']
    records_tasks = db['tasks']
    new_register = {
        'prolific_id': prolific_id,
        'timestamp': datetime.datetime.utcnow(),
        'feedback_id': str(feedback_id),
        'url': url,
        'status': status,
    }
    cursor_open = records_tasks.find({'url': url})
    cursor_done = records.find({'prolific_id': prolific_id, 'url': url})
    tasks_done = []
    task_open = []
    for doc in cursor_open:
        task_open.append(doc['feedback_id'])
    for doc in cursor_done:
        tasks_done.append(doc['feedback_id'])
    if type_feedback == 'star':
        new_register['rating'] = json_in['rating']
    if type_feedback == 'text':
        new_register['text'] = json_in['text']
    if type_feedback == 'textStar':
        new_register['rating'] = json_in['rating']
        new_register['text'] = json_in['text']
    records.insert_one(new_register)
    response = {
        'status': 'success',
        'done': len(tasks_done) + 1,
        'open': len(task_open)
    }
    return make_response(jsonify(response)), 200


@app.route('/getFeedback', methods=['POST'])
def get_feedback():
    json_in = request.get_json()
    prolific_id = json_in['prolific_id']
    url = json_in['url']
    db = mongo_client['CrowdSurfer']
    records = db['feedback']
    records_msg = db['message']
    records_tasks = db['tasks']
    now = datetime.datetime.utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(hours=24)
    cursor_msg = records_msg.find_one({'prolific_id': prolific_id})
    cursor_last_compensation = records.find({'prolific_id': prolific_id, 'status': 'done'}).sort('timestamp', -1).limit(
        1)
    cursor = records.find({'prolific_id': prolific_id, 'status': 'done'}).sort('timestamp', 1)
    compensation_month_query = records.find(
        {'prolific_id': prolific_id, 'status': 'done', 'timestamp': {'$lt': (now.replace(day=1, hour=23,
                                                                                         minute=59,
                                                                                         second=0,
                                                                                         microsecond=0)
                                                                             +
                                                                             timedelta(days=32))
                                                                                .replace(day=1) - timedelta(days=1),
                                                                     '$gt': now
                                                                                .replace(day=1, hour=0, minute=0,
                                                                                         second=0, microsecond=0)}})
    compensation_today_query = records.find(
        {'prolific_id': prolific_id, 'status': 'done', 'timestamp': {'$lt': day_end, '$gt': day_start}})
    compensation_today = 0
    for record in compensation_today_query:
        if record["rating"] != 0:
            compensation_today = compensation_today + 0.02
        if record["text"] != "":
            compensation_today = compensation_today + 0.13
    compensation_month = 0
    for record in compensation_month_query:
        if record["rating"] != 0:
            compensation_month = compensation_month + 0.02
        if record["text"] != "":
            compensation_month = compensation_month + 0.13
    cursor_open = records_tasks.find({'url': url['lastDomain']})
    cursor_done = records.find({'prolific_id': prolific_id, 'url': url['lastDomain']})
    tasks_done = []
    tasks_open = []
    for doc in cursor_open:
        tasks_open.append(doc['feedback_id'])
    for doc in cursor_done:
        tasks_done.append(doc['feedback_id'])
    len_tasks_open = len(tasks_open)
    len_tasks_done = len(tasks_done)
    last_act = {
        'today': round(compensation_today, 2),
        'month': round(compensation_month, 2),
        'message': cursor_msg['message'],
        'text': cursor_msg['text'],
        'href': cursor_msg['href'],
        'tasks_open': len_tasks_open,
        'tasks_done': len_tasks_done,
    }
    compensation_last = 0
    for record in cursor_last_compensation:
        if record["rating"] != 0:
            compensation_last = compensation_last + 0.02
        if record["text"] != "":
            compensation_last = compensation_last + 0.13
    for doc in cursor:
        last_act['compensation'] = round(compensation_last, 2),
        last_act['timestamp'] = doc['timestamp'].strftime('%c')
        last_act['url'] = doc['url']
    return make_response(dumps(last_act)), 200


@app.route('/queryTasks', methods=['POST'])
def query_tasks():
    json_in = request.get_json()
    url = json_in['url']
    prolific_id = json_in['prolific_id']
    db = mongo_client['CrowdSurfer']
    records_tasks = db['tasks']
    records_feedback = db['feedback']
    cursor_tasks = records_tasks.find({'url': url})
    tasks = {}
    for doc in cursor_tasks:
        feedback_id = doc['feedback_id']
        cursor_feedback = records_feedback.find({'feedback_id': feedback_id,
                                                 'prolific_id': prolific_id})
        if len(list(cursor_feedback)) == 0:
            tasks[feedback_id] = {
                'type': doc['type'],
                'dom': doc['dom_id'],
                'direction': doc['direction'],
                'text': doc['text'],
                'id': doc['feedback_id'],
                'position': doc['position'],
            }
    return make_response(dumps(tasks)), 200


@app.route('/info', methods=['POST'])
def info():
    json_in = request.get_json()
    feedback_id = json_in['feedback_id']
    db = mongo_client['CrowdSurfer']
    records = db['information']
    cursor = records.find_one({'feedback_id': str(feedback_id)})
    return make_response(dumps(cursor)), 200


@app.route('/log', methods=['POST'])
def log():
    json_in = request.get_json()
    prolific_id = json_in['prolific_id']
    log_type = json_in['log_type']
    feedback_id = json_in['feedback_id']
    db = mongo_client['CrowdSurfer']
    records = db['log']
    new_register = {
        'prolific_id': prolific_id,
        'log_type': log_type,
        'feedback_id': feedback_id,
        'timestamp': datetime.datetime.now().strftime('%c'),
    }
    records.insert_one(new_register)

    response = {
        'status': 'success',
    }
    return make_response(jsonify(response)), 200


@app.route('/news', methods=['POST'])
def news():
    json_in = request.get_json()
    prolific_id = json_in['prolific_id']
    db = mongo_client['CrowdSurfer']
    records_msg = db['message']
    cursor_msg = records_msg.find_one({'prolific_id': prolific_id})
    response = {
        'message': cursor_msg['message'],
        'text': cursor_msg['text'],
        'href': cursor_msg['href'],
        'refer': cursor_msg['refer'],
    }
    return make_response(jsonify(response)), 200


@app.route('/updateNews', methods=['POST'])
def update_news():
    json_in = request.get_json()
    prolific_id = json_in['prolific_id']
    db = mongo_client['CrowdSurfer']
    records_msg = db['message']
    filter_pymongo = {'prolific_id': prolific_id}
    new_values = {"$set": {'message': 'showed'}}
    records_msg.update_one(filter_pymongo, new_values)
    response = {
        'status': 'success',
    }
    return make_response(jsonify(response)), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0')
