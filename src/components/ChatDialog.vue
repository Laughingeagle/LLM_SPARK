<template>
  <el-dialog v-model="dialogVisible" title="AI对话" width="600px">
    <div class="message-container" ref="messageContainer">
      <div v-for="(message, index) in messages" :key="index" class="message-item">
        <div :class="['message-bubble', message.sender]">
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
      <el-empty v-if="!messages.length" description="暂无对话记录" />
    </div>

    <div class="input-area">
      <el-input
        v-model="inputMessage"
        placeholder="输入您的问题"
        :disabled="loading"
        @keyup.enter="sendMessage"
      >
        <template #append>
          <el-button
            :loading="loading"
            type="primary"
            @click="sendMessage"
            :disabled="!inputMessage.trim()"
          >
            发送
          </el-button>
        </template>
      </el-input>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import * as CryptoJS from 'crypto-js'
import axios from 'axios'
import { ElLoading } from 'element-plus'

interface Message {
  content: string
  sender: 'user' | 'ai'
  timestamp: number
  loading?: boolean
}

interface TextChoice {
  role: string;
  content: string;
}

const dialogVisible = ref(false)
const inputMessage = ref('')
const messages = reactive<Message[]>([])
const messageContainer = ref<HTMLElement | null>(null)
const loading = ref(false)
const aiResponse = ref('')

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTo({
      top: messageContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  const userMessage: Message = {
    content: inputMessage.value.trim(),
    sender: 'user',
    timestamp: Date.now()
  }
  messages.push(userMessage)
  
  const aiMessage: Message = {
    content: '',
    sender: 'ai',
    timestamp: Date.now(),
    loading: true
  }
  messages.push(aiMessage)
  
  inputMessage.value = ''
  loading.value = true

  try {
    const { VITE_AI_APP_ID, VITE_AI_API_KEY, VITE_AI_API_SECRET } = import.meta.env
    
    // 1. Fix host name in signature
    // 修改鉴权参数生成逻辑
    const date = new Date().toUTCString()
    
    // 删除旧鉴权逻辑（约20行代码）
    
    // 修正后的签名生成逻辑（保持顺序）
    const signatureOrigin = `host: spark-api.xf-yun.com\ndate: ${date}\nGET /v1.1/chat HTTP/1.1`
    const signature = CryptoJS.HmacSHA256(signatureOrigin, VITE_AI_API_SECRET)
      .toString(CryptoJS.enc.Base64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    // 调试日志现在可以正确访问signatureOrigin
    console.log('鉴权参数详情', {
      authorizationRaw: `api_key="${VITE_AI_API_KEY}"...`, // 简化显示
      signatureOrigin,
      dateUTC: date,
      finalSignature: signature
    })
    
    const authorization = encodeURIComponent(
      `api_key="${VITE_AI_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    )
    
    // 仅保留一个WebSocket连接创建语句
    const socket = new WebSocket(
      `wss://spark-api.xf-yun.com/v1.1/chat?authorization=${authorization}&date=${btoa(date)}&host=spark-api.xf-yun.com`
    )
    
    // 添加心跳检测
    let heartbeatTimer: number
    
    socket.onopen = () => {
      heartbeatTimer = setInterval(() => {
        socket.send(JSON.stringify({ type: "ping" }))
      }, 30000)
    }
    
    socket.onclose = (event) => {
      clearInterval(heartbeatTimer)
      if (event.code === 1006) {
        aiMessage.content = '连接异常断开，请重试'
      }
    }
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.header.code !== 0) {
          throw new Error(`[${data.header.code}]${data.header.message}`)
        }
        
        // 验证响应数据结构
        if (data?.payload?.choices?.text) {
          const validText = (data.payload.choices.text as TextChoice[]).filter(Boolean)
          aiMessage.content += validText
            .filter(t => t.role === 'assistant')
            .map(t => t.content)
            .join('')
          
          messages[messages.length - 1] = { ...aiMessage }
          scrollToBottom()
        }
        
        if (data.header.status === 2) {
          loading.value = false
          socket.close()
        }
      } catch (e) {  // ← 修正后的catch块位置
        aiMessage.content = `响应解析失败：${(e as Error).message}`
        loading.value = false
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket错误:', error)
      loading.value = false
    }

    socket.onclose = (event) => {
      console.log('WebSocket连接参数', {
        authorization,
        date: btoa(date),
        signatureOrigin,
        finalUrl: `wss://spark-api.xf-yun.com/v1.1/chat?authorization=${authorization}&date=${btoa(date)}&host=spark-api.xf-yun.com`
      })
    }


  } catch (error) {
    console.error('API请求失败:', error)
    aiMessage.content = '请求失败：' + (
      (error as any)?.response?.data?.message ||
      (error as Error).message ||
      '服务暂时不可用，请稍后重试'
    )
  } finally {
    aiMessage.loading = false
    loading.value = false
    scrollToBottom()
  }
}

defineExpose({
  open: () => dialogVisible.value = true,
  close: () => dialogVisible.value = false
})
</script>

<style lang="scss" scoped>
.message-container {
  height: 60vh;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 20px;
  background-color: #f8f8f8;
  border-radius: 4px;

  .message-item {
    margin: 10px 0;

    .message-bubble {
      max-width: 80%;
      padding: 12px;
      border-radius: 12px;
      position: relative;

      &.user {
        background-color: #409eff;
        color: white;
        margin-left: auto;
      }

      &.ai {
        background-color: #ffffff;
        border: 1px solid #ebeef5;
        margin-right: auto;
      }

      .message-time {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
        text-align: right;
      }
    }
  }
}

.input-area {
  margin-top: 20px;
}
</style>