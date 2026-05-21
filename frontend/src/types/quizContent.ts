export type LocalizedQuestionOption = {
  key: string
  label: string
}

export type LocalizedQuestion = {
  question: string
  options: LocalizedQuestionOption[]
}

export type QuizContent = {
  title?: {
    heading?: string
    subtitle?: string
    startButton?: string
  }
  ui?: {
    back?: string
    confirm?: string
    passionReset?: string
    partnerEmptySelection?: string
    partnerInstruction?: string
    answerInstruction?: string
    imageInstruction?: string
    graduationInstruction?: string
    passionSwipeStart?: string
    passionSwipeMiddle?: string
    passionSwipeEnd?: string
    adventureSwipeStart?: string
    adventureSwipeMiddle?: string
    adventureSwipeEnd?: string
    resultsMain?: string
    resultsSubtitle?: string
    resultsButton?: string
  }
  questions?: Record<string, LocalizedQuestion>
}
