<template>
  <div class="container">
    <el-button type="primary" @click="chatDialog?.open">打开AI对话</el-button>
    <ChatDialog ref="chatDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatDialog from './components/ChatDialog.vue'

interface ChatDialogExpose {
  open: () => void
  close: () => void
}

const chatDialog = ref<InstanceType<typeof ChatDialog> & { open: () => void; close: () => void }>()!
</script>

<style>
.container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>