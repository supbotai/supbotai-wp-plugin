let history = [];
let token = "";
let token_exp = 0;
let brand_name = "";
let brand_about = "";
let brand_voice = "";

document.getElementById('supbotai-toggle-btn').addEventListener('click', supbotai_toggle_chat);

async function supbotai_toggle_chat() {
    var chatBtn = document.getElementById('supbotai-toggle-btn');
    var chatbody = document.getElementById('supbotai-chatbody');

    // Apply the pressed effect
    chatBtn.style.transform = "translateY(4px)";

    // After a short delay, reset the pressed effect and toggle the chat
    setTimeout(function() {
        chatBtn.style.transform = "";
    }, 100);

    // Toggle chat state after a slightly longer delay to ensure animations look smooth
    setTimeout(function() {
        if (chatBtn.classList.contains('closed')) {
            chatBtn.classList.remove('closed');
            chatBtn.classList.add('open');
            chatbody.style.display = 'block';
            check_token();
        } else {
            chatBtn.classList.remove('open');
            chatBtn.classList.add('closed');
            chatbody.style.display = 'none';
        }
    }, 150);
}

document.getElementById('supbotai-message-send-btn').addEventListener('click', supbotai_send);

document.getElementById('supbotai-message-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        supbotai_send();
    }
});

async function supbotai_send()
{
    var messageInput = document.getElementById('supbotai-message-input');
    var question = messageInput.value.trim();

    if(messageInput.value == '')
        return;

    // Visual feedback for the response
    var messagesWrapper = document.getElementById('supbotai-messages-wrapper');
    
    var questionDiv = document.createElement('div');
    questionDiv.textContent = question;
    questionDiv.classList.add('supbotai-message');
    messagesWrapper.appendChild(questionDiv);
    messageInput.value = '';

    var answerDiv = document.createElement('div');
    answerDiv.classList.add('supbotai-message');
    answerDiv.classList.add('supbotai-message-bot');
    var cursorSpan = document.createElement('span');
    cursorSpan.textContent = '_';
    cursorSpan.classList.add('supbotai-blinking-cursor');
    answerDiv.appendChild(cursorSpan);
    messagesWrapper.appendChild(answerDiv);

    try {
        await check_token()
    } catch (err) {
        answerDiv.classList.add('supbotai-message-error');
        answerDiv.textContent = supbotai_settings.error_message;
        return;
    }

    if (question) {
        ajax_stream({
            url: 'https://api.supbot.ai/stream',
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({
                token: token,
                question: question,
                brand_name: brand_name,
                brand_about: brand_about,
                brand_voice: brand_voice,
                history: JSON.stringify(history)
            }),
            onprogress: function(stream) {
                answerDiv.textContent = supbotai_parse_stream(stream);
            },
            oncomplete: function() {
                history.push({prompt: question, completion: answerDiv.textContent});
            },
            error: function(err) {
                console.log(err);
                answerDiv.classList.add('supbotai-message-error');
                answerDiv.textContent = supbotai_settings.error_message;
            }
        });
    }
}

function ajax_stream(options) {
    var xhr = new XMLHttpRequest();
    xhr.open(options.method || 'GET', options.url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (options.headers) {
        Object.keys(options.headers).forEach(function(key) {
            xhr.setRequestHeader(key, options.headers[key]);
        });
    }
    xhr.onprogress = function() {
        options.onprogress(xhr.responseText);
    };
    xhr.onload = function() {
        if (xhr.status !== 200) {
            if (options.error) {
                options.error(xhr.statusText);
            }
        }
        if (options.oncomplete) {
            options.oncomplete();
        }
    };
    xhr.onerror = function() {
        if (options.error) {
            options.error(xhr.statusText);
        }
    };
    xhr.send(options.data || null);
}

function supbotai_parse_stream(stream) {
    const lines = stream.split("\n");
    let answer = "";
    let end = false;

    lines.forEach(line => {
        const jsonString = line.replace("data:", "").trim();
        if (!jsonString) {
            return;
        }
        try {
            const dataObj = JSON.parse(jsonString);
            if (dataObj.type === "end") {
                end = true;
            } else if (dataObj.answer) {
                answer += dataObj.answer;
            }
        } catch (err) {
            console.error("Error parsing JSON chunk:", err);
        }
    });
    if (!end) {
        answer += '_';
    }
    return answer;
}

async function check_token() {

    if(token == "") {
        await get_token();
        return;
    }

    const now = Date.now() / 1000;

    if (now > token_exp - 300) {
        await get_token();
    }
}

async function get_token() {
    const payload = {
        project_key: supbotai_settings.project_key
    };
    try {
        let response = await fetch('https://api.supbot.ai/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        let data = await response.json();
        token = data['token'];
        brand_name = data['brand_name'];
        brand_about = data['brand_about'];
        brand_voice = data['brand_voice'];

        const parsed_payload = parse_jwt(token);

        const now = Date.now() / 1000;
        const time_diff = now - parsed_payload['iat'];
        token_exp = parsed_payload['exp'] + time_diff;
        return;
    } catch (error) {
        console.error("Error: ", error);
        throw error;
    }
}

function parse_jwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}