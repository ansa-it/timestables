<script setup>
import { computed, ref } from 'vue'

const factorA = ref(1)
const factorB = ref(1)
const correctAnswer = ref(1)
const choices = ref([])
const selectedAnswer = ref(null)
const isLocked = ref(false)
const score = ref(0)
const streak = ref(0)
const feedbackText = ref('Wähle die richtige Antwort!')
const feedbackType = ref('')
const rewardThreshold = ref(2)
const showEmoji = ref(false)
const currentEmoji = ref('')

const emojis = ['🌟', '🎉', '👏', '🦊', '🚀', '😺', '🍀', '🎈', '🏅', '💫']

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const taskText = computed(() => `${factorA.value} x ${factorB.value}`)
const remainingForEmoji = computed(() => Math.max(rewardThreshold.value - streak.value, 0))

const setupRewardThreshold = () => {
  rewardThreshold.value = 10
}

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

const generateQuestion = () => {
  factorA.value = randomInt(1, 10)
  factorB.value = randomInt(1, 10)
  correctAnswer.value = factorA.value * factorB.value

  const answerSet = new Set([correctAnswer.value])

  while (answerSet.size < 3) {
    const delta = randomInt(1, 10) * (Math.random() < 0.5 ? -1 : 1)
    const candidate = correctAnswer.value + delta
    if (candidate > 0) {
      answerSet.add(candidate)
    }
  }

  choices.value = shuffle(Array.from(answerSet))
  selectedAnswer.value = null
  isLocked.value = false
  feedbackText.value = 'Wähle die richtige Antwort!'
  feedbackType.value = ''
  showEmoji.value = false
}

const getButtonClass = (choice) => {
  if (!isLocked.value) {
    return ''
  }

  if (choice === correctAnswer.value) {
    return 'correct disabled'
  }

  if (choice === selectedAnswer.value && choice !== correctAnswer.value) {
    return 'wrong disabled'
  }

  return 'disabled'
}

const chooseAnswer = (choice) => {
  if (isLocked.value) {
    return
  }

  selectedAnswer.value = choice
  isLocked.value = true

  if (choice === correctAnswer.value) {
    score.value += 1
    streak.value += 1
    feedbackType.value = 'good'
    feedbackText.value = 'Richtig! Super gemacht!'

    if (streak.value >= rewardThreshold.value) {
      currentEmoji.value = emojis[randomInt(0, emojis.length - 1)]
      showEmoji.value = true
      setupRewardThreshold()
      streak.value = 0
    }
  } else {
    streak.value = 0
    feedbackType.value = 'bad'
    feedbackText.value = `Fast! Die richtige Antwort ist ${correctAnswer.value}.`
  }

  window.setTimeout(() => {
    generateQuestion()
  }, 1300)
}

setupRewardThreshold()
generateQuestion()
</script>

<template>
  <main class="app-shell">
    <section class="game-card" aria-live="polite">
      <div v-if="showEmoji" class="emoji-overlay" aria-label="Belohnung">
        <div class="emoji-burst">{{ currentEmoji }}</div>
      </div>

      <h1 class="title">Kleines 1x1</h1>
      <p class="subtitle">Trainiere spielerisch dein Mathe-Gehirn</p>

      <div class="stats">
        <article class="stat-box">
          <span class="stat-label">Punkte</span>
          <span class="stat-value">{{ score }}</span>
        </article>
        <article class="stat-box">
          <span class="stat-label">Serie</span>
          <span class="stat-value">{{ streak }}</span>
        </article>
        <article class="stat-box">
          <span class="stat-label">Bis Emoji</span>
          <span class="stat-value">{{ remainingForEmoji }}</span>
        </article>
      </div>

      <div class="question">
        <p class="question-lead">Wie viel ist:</p>
        <p class="question-task">{{ taskText }} = ?</p>
      </div>

      <div class="answers">
        <button
          v-for="choice in choices"
          :key="choice"
          class="answer-btn"
          :class="getButtonClass(choice)"
          @click="chooseAnswer(choice)"
          :disabled="isLocked"
        >
          {{ choice }}
        </button>
      </div>
      <p class="feedback" :class="feedbackType">{{ feedbackText }}</p>
    </section>
  </main>
</template>
