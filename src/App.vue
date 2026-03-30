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
const rewardThreshold = ref(6)
const showEmoji = ref(false)
const currentEmoji = ref('')
const currentView = ref('lernen')

const navItems = [
  { key: 'lernen', label: 'Lernen', icon: 'book' },
  { key: 'profil', label: 'Profil', icon: 'user' }
]

const emojis = ['🌟', '🎉', '👏', '🦊', '🚀', '😺', '🍀', '🎈', '🏅', '💫']
const progressRadius = 17
const progressCircumference = 2 * Math.PI * progressRadius

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const taskText = computed(() => `${factorA.value} x ${factorB.value}`)
const streakCycleProgress = computed(() => streak.value % rewardThreshold.value)
const remainingForEmoji = computed(() => {
  if (streak.value > 0 && streakCycleProgress.value === 0) {
    return 0
  }

  return rewardThreshold.value - streakCycleProgress.value
})
const solvedCount = computed(() => score.value + streak.value)
const rewardProgressPercent = computed(() => {
  if (streak.value > 0 && streakCycleProgress.value === 0) {
    return 1
  }

  return streakCycleProgress.value / rewardThreshold.value
})
const rewardProgressOffset = computed(
  () => progressCircumference * (1 - rewardProgressPercent.value)
)
const activeScreenTitle = computed(() => {
  if (currentView.value === 'profil') {
    return 'Deine Statistik'
  }

  return 'Kleines 1x1'
})

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

    if (streak.value % rewardThreshold.value === 0) {
      currentEmoji.value = emojis[randomInt(0, emojis.length - 1)]
      showEmoji.value = true
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

generateQuestion()
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="bar-inner">
        <div class="header-main-row">
          <div>
            <p class="header-kicker">Mathe Trainer</p>
            <h1 class="header-title">{{ activeScreenTitle }}</h1>
            <p v-if="currentView === 'lernen'" class="header-subtitle">
              Trainiere spielerisch dein Mathe-Gehirn
            </p>
          </div>

          <div class="reward-ring" aria-label="Belohnung in {{ remainingForEmoji }} richtigen Antworten">
            <svg viewBox="0 0 44 44" class="ring-svg" aria-hidden="true">
              <circle class="ring-track" cx="22" cy="22" :r="progressRadius" />
              <circle
                class="ring-value"
                cx="22"
                cy="22"
                :r="progressRadius"
                :stroke-dasharray="progressCircumference"
                :stroke-dashoffset="rewardProgressOffset"
              />
            </svg>
            <span class="ring-text">{{ remainingForEmoji }}</span>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <section v-show="currentView === 'lernen'" class="screen" aria-live="polite">
        <article class="game-card">
          <div v-if="showEmoji" class="emoji-overlay" aria-label="Belohnung">
            <div class="emoji-burst">{{ currentEmoji }}</div>
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
        </article>
      </section>

      <section v-show="currentView === 'profil'" class="screen">
        <article class="panel-card">
          <h2 class="panel-title">Fortschritt heute</h2>
          <p class="panel-copy">
            Du hast aktuell <strong>{{ score }}</strong> richtige Antworten gesammelt.
          </p>
          <p class="panel-copy">
            Deine längste laufende Serie liegt bei <strong>{{ streak }}</strong>.
          </p>
          <p class="panel-copy">
            Bleib dran: In <strong>{{ remainingForEmoji }}</strong> richtigen Antworten wartet die nächste Belohnung.
          </p>
        </article>
      </section>
    </main>

    <footer class="app-footer">
      <nav class="tab-nav" aria-label="Hauptnavigation">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="tab-item"
          :class="{ active: currentView === item.key }"
          @click="currentView = item.key"
          :aria-label="item.label"
        >
          <span class="tab-icon" aria-hidden="true">
            <svg v-if="item.icon === 'book'" viewBox="0 0 24 24" fill="none">
              <path d="M6 4.5C4.9 4.5 4 5.4 4 6.5V18c0 1.1.9 2 2 2h12V6.5c0-1.1-.9-2-2-2H6z" stroke="currentColor" stroke-width="1.8" />
              <path d="M8 8h6M8 11h6M8 14h4" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
            </svg>

            <svg v-else viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.3" stroke="currentColor" stroke-width="1.8" />
              <path d="M5.5 19c1.7-2.6 4-3.9 6.5-3.9s4.8 1.3 6.5 3.9" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
            </svg>
          </span>
          <span class="tab-label">{{ item.label }}</span>
        </button>
      </nav>
    </footer>
  </div>
</template>
