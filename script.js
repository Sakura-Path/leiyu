// 获取DOM元素
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const chineseText = document.getElementById('chineseText');
const japaneseText = document.getElementById('japaneseText');

// 检查浏览器是否支持语音识别
if (!('webkitSpeechRecognition' in window)) {
    alert('您的浏览器不支持语音识别功能，请使用Chrome浏览器。');
    startBtn.disabled = true;
}

// 创建语音识别实例
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'zh-CN';

// 创建语音合成实例
const synthesis = window.speechSynthesis;

// 开始录音按钮点击事件
startBtn.addEventListener('click', () => {
    recognition.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    status.textContent = '正在录音...';
});

// 停止录音按钮点击事件
stopBtn.addEventListener('click', () => {
    recognition.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    status.textContent = '已停止录音';
});

// 语音识别结果处理
recognition.onresult = async (event) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;
    
    if (result.isFinal) {
        chineseText.textContent = transcript;
        status.textContent = '正在翻译...';
        
        try {
            const response = await translateText(transcript);
            japaneseText.textContent = response;
            // 确保翻译完成后再播放语音
            setTimeout(() => speakJapanese(response), 100);
        } catch (error) {
            console.error('翻译错误:', error);
            status.textContent = '翻译出错';
        }
    }
};

// 语音识别错误处理
recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error);
    status.textContent = '识别出错';
    startBtn.disabled = false;
    stopBtn.disabled = true;
};

// 翻译函数
async function translateText(text) {
    try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=ja&dt=t&q=${encodeURIComponent(text)}`);
        const data = await response.json();
        return data[0][0][0];
    } catch (error) {
        console.error('翻译请求失败:', error);
        throw error;
    }
}

// 日语语音合成函数
function speakJapanese(text) {
    // 停止当前正在播放的语音
    synthesis.cancel();
    
    // 等待一小段时间确保之前的语音已停止
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.8; // 降低语速，使发音更清晰
        utterance.pitch = 1.0;
        utterance.volume = 1.0; // 确保音量最大
        
        // 添加错误处理
        utterance.onerror = (event) => {
            console.error('语音合成错误:', event);
            status.textContent = '语音播放出错';
        };
        
        // 添加播放完成事件
        utterance.onend = () => {
            status.textContent = '语音播放完成';
        };
        
        // 添加播放开始事件
        utterance.onstart = () => {
            status.textContent = '正在播放日语...';
        };
        
        // 获取可用的语音列表
        const voices = synthesis.getVoices();
        // 尝试找到日语语音
        const japaneseVoice = voices.find(voice => voice.lang.includes('ja'));
        if (japaneseVoice) {
            utterance.voice = japaneseVoice;
        }
        
        synthesis.speak(utterance);
    }, 100);
}

// 确保语音列表加载完成
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        const voices = synthesis.getVoices();
        console.log('可用的语音列表:', voices);
    };
} 