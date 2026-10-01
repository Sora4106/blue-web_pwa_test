const DEVICE_NAME = "ESP32-CAM BLE Test";
const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const RX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const MAX_MESSAGE_BYTES = 180;

const card = document.querySelector("#connection-card");
const statusText = document.querySelector("#connection-status");
const notice = document.querySelector("#ios-notice");
const connectButton = document.querySelector("#connect-button");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message");
const sendButton = document.querySelector("#send-button");
const log = document.querySelector("#message-log");

let device = null;
let rxCharacteristic = null;
let txCharacteristic = null;

function addLog(text) {
  const item = document.createElement("li");
  const timestamp = new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
  item.textContent = `${timestamp}  ${text}`;
  log.prepend(item);
  while (log.children.length > 30) log.lastElementChild.remove();
}

function setStatus(text, connected = false) {
  statusText.textContent = text;
  card.classList.toggle("connected", connected);
}

function setConnected(connected) {
  messageInput.disabled = !connected;
  sendButton.disabled = !connected || !messageInput.value.trim();
  connectButton.disabled = connected;
  connectButton.textContent = connected ? "已連線" : "連接 ESP32-CAM";
}

function onDisconnected() {
  rxCharacteristic = null;
  txCharacteristic = null;
  setConnected(false);
  setStatus("ESP32-CAM 已中斷連線");
  addLog("連線已中斷");
}

function onNotification(event) {
  const value = event.target.value;
  const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  const received = new TextDecoder("utf-8").decode(bytes);
  addLog(`ESP32 → 手機：${received}`);
}

async function connect() {
  if (!navigator.bluetooth) {
    setStatus("找不到 Web Bluetooth。請啟用 iPhone 的 BLE 橋接擴充功能後重新開啟本頁。");
    notice.hidden = false;
    return;
  }

  connectButton.disabled = true;
  connectButton.textContent = "連線中…";
  setStatus("請在系統選單選擇 ESP32-CAM BLE Test…");

  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: DEVICE_NAME }],
      optionalServices: [SERVICE_UUID],
    });
    device.addEventListener("gattserverdisconnected", onDisconnected);

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    rxCharacteristic = await service.getCharacteristic(RX_UUID);
    txCharacteristic = await service.getCharacteristic(TX_UUID);
    await txCharacteristic.startNotifications();
    txCharacteristic.addEventListener("characteristicvaluechanged", onNotification);

    setConnected(true);
    setStatus(`已連線：${device.name || DEVICE_NAME}，正在接收通知`, true);
    addLog("已連線並訂閱 ESP32 通知");
  } catch (error) {
    const detail = error instanceof Error ? error.message : "連線被取消或失敗。";
    setConnected(false);
    setStatus(`無法連線：${detail}`);
    addLog(`連線失敗：${detail}`);
  }
}

async function sendMessage(event) {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !rxCharacteristic) return;

  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength > MAX_MESSAGE_BYTES) {
    setStatus(`訊息過長：上限為 ${MAX_MESSAGE_BYTES} bytes`, true);
    return;
  }

  try {
    if (rxCharacteristic.writeValueWithResponse) {
      await rxCharacteristic.writeValueWithResponse(bytes);
    } else {
      await rxCharacteristic.writeValue(bytes);
    }
    addLog(`手機 → ESP32：${text}`);
    messageInput.value = "";
    sendButton.disabled = true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "訊息未送出。";
    setStatus(`傳送失敗：${detail}`, true);
    addLog(`傳送失敗：${detail}`);
  }
}

connectButton.addEventListener("click", connect);
messageForm.addEventListener("submit", sendMessage);
messageInput.addEventListener("input", () => {
  sendButton.disabled = !rxCharacteristic || !messageInput.value.trim();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => undefined);
}

if (navigator.bluetooth) {
  setStatus("此瀏覽器可使用 Web Bluetooth");
} else {
  setStatus("此 iPhone 尚未提供 Web Bluetooth 橋接");
  notice.hidden = false;
}
