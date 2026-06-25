<script setup lang="ts">
import { ref } from "vue";
import JsonRegistrationView from "./JsonRegistrationView.vue";
import ConceptImportView from "./ConceptImportView.vue";

type RegisterType = "problem" | "concept";
const activeType = ref<RegisterType>("problem");
</script>

<template>
  <div :style="{ width: '100%' }">
    <!-- 타입 토글 -->
    <div :style="{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }">
      <button
        @click="activeType = 'problem'"
        :style="{
          padding: '0.625rem 1.25rem',
          borderRadius: '8px',
          border: activeType === 'problem' ? '1.5px solid #C8962A' : '1px solid #E5E7EB',
          backgroundColor: activeType === 'problem' ? '#FEF8EC' : '#FFFFFF',
          color: activeType === 'problem' ? '#C8962A' : '#6B7280',
          fontWeight: activeType === 'problem' ? 600 : 400,
          fontSize: '0.875rem',
          cursor: 'pointer',
        }"
      >
        📄 문제 JSON 등록
      </button>
      <button
        @click="activeType = 'concept'"
        :style="{
          padding: '0.625rem 1.25rem',
          borderRadius: '8px',
          border: activeType === 'concept' ? '1.5px solid #C8962A' : '1px solid #E5E7EB',
          backgroundColor: activeType === 'concept' ? '#FEF8EC' : '#FFFFFF',
          color: activeType === 'concept' ? '#C8962A' : '#6B7280',
          fontWeight: activeType === 'concept' ? 600 : 400,
          fontSize: '0.875rem',
          cursor: 'pointer',
        }"
      >
        💡 개념 JSON 등록
      </button>
    </div>

    <!-- 콘텐츠 -->
    <JsonRegistrationView v-if="activeType === 'problem'" />
    <ConceptImportView v-else />
  </div>
</template>
