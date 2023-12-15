const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const request = {
    url: '/confirm',
    method: 'POST',
    data: {
        prolific_id: urlParams.get('id'),
    },
}

function addListeners(request) {
    const confirm = document.getElementById('textStarSubmit');
    confirm.addEventListener('click', () => {
        const text = $('#textStar').val();
        let rating;
        if (text.length < 10) {
            $('#danger-text-stars').show();
            return;
        }
        if ($('#ratingText-5').is(':checked')) {
            rating = 5;
        } else if ($('#ratingText-4').is(':checked')) {
            rating = 4;
        } else if ($('#ratingText-3').is(':checked')) {
            rating = 3;
        } else if ($('#ratingText-2').is(':checked')) {
            rating = 2;
        } else if ($('#ratingText-1').is(':checked')) {
            rating = 1;
        } else {
            $('#danger-text-stars').show();
            return;
        }
        const requestData = JSON.stringify(request.data);
        fetch(request.url, {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: requestData,
        })
            .then((response) => response.json())
            .then(() => {
                $('.lds-dual-ring').show();
                $('#textStar').hide();
                $('.rating').hide();
                $('#danger-text-stars').hide();
                $('#textStarSubmit').hide();
                setTimeout(() => {
                    window.location.replace("/success");
                }, 2000);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        return true;
    });
}

addListeners(request)

$(document).ready(function () {
    let next = 0;
    $("#next").click(function () {
        console.log(next);
        switch (next) {
            case 0:
                console.log('here2');
                $('#step1').hide();
                $('#step2').show();
                next = next + 1;
                break;
            case 1:
                $('#step2').hide();
                $('#step3').show();
                $('#red-border-1').css('border', '2px solid red');
                next = next + 1;
                break;
            case 2:
                $('#step3').hide();
                $('#step4').show();
                $("#dropdownTextStar2").css('display', 'block')
                $('#remind2').css('border', '2px solid red');
                next = next + 1;
                break;
            case 3:
                $('#step4').hide();
                $('#step5').show();
                $('#remind2').css('border', '0px solid red')
                $('#moreInfo2').css('border', '2px solid red');
                next = next + 1;
                break;
            case 4:
                $('#step5').hide();
                $('#step6').show();
                $('#moreInfo2').css('border', '0px solid red')
                $('#red-border-1').css('border', '0px solid red')
                $('#minimizeTextStar').css('border', '2px solid red');
                $("#dropdownTextStar2").css('display', 'none');
                next = next + 1;
                break;
            case 5:
                $('#step6').hide();
                $('#step7').show();
                $('#minimizeTextStar').css('border', '0px solid red')
                $('#removeTextStar').css('border', '2px solid red');

                next = next + 1;
                break;
            case 6:
                $('#step7').hide();
                $('#next').hide();
                $('#step8').show();
                $('#removeTextStar').css('border', '0px solid red')
                $('#textStarSubmit').removeAttr('disabled', '');
                next = next + 1;
                break;
            default:
                return;
        }
    });

    $(document).on('click', '#minimizeTextStar', () => {
        $('.arrow-top').hide();
        $('#badge-top-textStar').css('display', 'inline-block');
    });

    $(document).on('click', '#badge-top-textStar', () => {
        $('.arrow-top').show();
        $('#badge-top-textStar').hide();
    });

    $(document).on('click', "#toggleTextStar", () => {
        if ($("#dropdownTextStar2").css('display') === 'none') {
            $("#dropdownTextStar2").css('display', 'block');
        } else {
            $("#dropdownTextStar2").css('display', 'none');
        }
    });

});
