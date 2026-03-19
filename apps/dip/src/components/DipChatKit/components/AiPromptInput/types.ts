import type { SenderProps } from '@ant-design/x'
import type { ReactNode } from 'react'

export interface AiPromptMentionOption {
  id: string
  label: string
  description?: string
  avatar?: ReactNode
}

export interface TriggerCharacterItem {
  character: string
  options: AiPromptMentionOption[]
}

export interface AiPromptSubmitPayload {
  content: string
  mentions: AiPromptMentionOption[]
  files: File[]
}

export type MentionTriggerSource = 'keyboard' | 'button'

export interface CursorAnchorPosition {
  left: number
  top: number
}

export interface MentionTriggerMatch {
  character: string
  query: string
}

export interface AiPromptInputProps {
  value?: string
  defaultValue?: string
  autoSize?: SenderProps['autoSize']
  onChange?: (value: string) => void
  onSubmit?: (payload: AiPromptSubmitPayload) => void
  onAttach?: (files: File[]) => void
  onMentionSelect?: (item: AiPromptMentionOption) => void
  mentionOptions?: AiPromptMentionOption[]
  placeholder?: string
  mentionPanelTitle?: string
  mentionButtonLabel?: string
  attachButtonTitle?: string
  sendButtonTitle?: string
  triggerCharacter?: false | TriggerCharacterItem[]
  disabled?: boolean
  loading?: boolean
  className?: string
}
