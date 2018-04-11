
// TODO: get types via OA 3.0 and new TSOA

/**
 * A Facebook Bot Message can be either an UPDATE (24h+1)
 * or a NON_PROMOTIONAL_SUBSCRIPTION message (required permission: pages_messaging_subscriptions).
 * a `tag` is only required, when the messaging_type is MESSAGE_TAG. It too can be sent outside
 * of the standard 24h+1 window.
 */

export type FacebookBotMessagingType = 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' | 'NON_PROMOTIONAL_SUBSCRIPTION'

export interface FacebookRefMessage {
  recipient: {
    user_ref: string
  }
  message: FacebookBotMessageMessage
}

export interface FacebookBotMessage {
  messaging_type: FacebookBotMessagingType
  tag?: 'PAIRING_UPDATE'
  | 'APPLICATION_UPDATE'
  | 'ACCOUNT_UPDATE'
  | 'PAYMENT_UPDATE'
  | 'PERSONAL_FINANCE_UPDATE'
  | 'SHIPPING_UPDATE'
  | 'RESERVATION_UPDATE'
  | 'ISSUE_RESOLUTION'
  | 'GAME_EVENT'
  | 'TRANSPORTATION_UPDATE'
  | 'FEATURE_FUNCTIONALITY_UPDATE'
  | 'TICKET_UPDATE'
  | 'APPOINTMENT_UPDATE'
  recipient: FacebookBotMessageRecipient,
  message?: FacebookBotMessageMessage
}

export interface QuickReply {
  content_type: 'text' | 'location'
  title?: string
  image_url?: string
  payload?: string
}

export interface FacebookBotMessageFilePayload {
  url: string
  is_reusable: boolean
}

export interface FacebookBotMessageShareContentsAttachment {
  type: 'template'
  payload: FacebookBotMessageTemplate
}

export interface FacebookBotMessageShareContents {
  attachment: FacebookBotMessageShareContentsAttachment
}

export interface FacebookBotMessageButtonObject {
  title: string
  type: 'web_url' | 'postback' | 'element_share' | 'phone_number'
  url?: string
  payload?: string
  share_contents?: FacebookBotMessageShareContents
}

export interface FacebookBotMessageDefaultAction {
  type: 'web_url'
  url: string
  messenger_extensions?: boolean
  webview_height_ratio?: 'COMPACT' | 'TALL' | 'FULL'
  fallback_url?: string
}

export interface FacebookBotMessageGenericElement {
  title: string
  subtitle?: string
  image_url?: string
  default_action: FacebookBotMessageDefaultAction
  buttons?: FacebookBotMessageButtonObject[]
}

/**
 * uses Open Graph Meta Data from Websites to show elements like a player.
 * e.g. https://open.spotify.com/track/7GhIk7Il098yCjg4BQjzvb
 */
export interface FacebookBotMessageOpenGraphElement {
  url: string
  buttons: FacebookBotMessageButtonObject[]
}

export interface FacebookBotMessageGenericTemplate {
  template_type: 'generic'
  elements: FacebookBotMessageGenericElement[]
  sharable: boolean
  image_aspect_ratio: 'square' | 'horizontal'
}

export interface FacebookBotMessageOpenGraphTemplate {
  template_type: 'open_graph'
  elements: [ FacebookBotMessageOpenGraphElement ]
}

export type FacebookBotMessageTemplate = FacebookBotMessageOpenGraphTemplate | FacebookBotMessageGenericTemplate

export interface FacebookBotMessageImageAttachment {
  type: 'image'
  payload: FacebookBotMessageFilePayload
}

export interface FacebookBotMessageAudioAttachment {
  type: 'audio',
  payload: FacebookBotMessageFilePayload
}

export interface FacebookBotMessageVideoAttachment {
  type: 'video',
  payload: FacebookBotMessageFilePayload
}

export interface FacebookBotMessageFileAttachment {
  type: 'file'
  payload: FacebookBotMessageFilePayload
}

export interface FacebookBotMessageTemplateAttachment {
  type: 'template'
  payload: FacebookBotMessageTemplate
}

export type FacebookBotMessageAttachment = FacebookBotMessageImageAttachment
  | FacebookBotMessageAudioAttachment
  | FacebookBotMessageVideoAttachment
  | FacebookBotMessageFileAttachment
  | FacebookBotMessageTemplateAttachment

export interface FacebookBotMessageRecipient {
  id: string
}

export interface FacebookBotMessageMessage {
  key?: string
  text?: string
  attachment?: FacebookBotMessageAttachment
  quick_replies?: QuickReply[]
  metadata?: string
}

// custom
export interface FacebookBotMessageMessageEditable extends FacebookBotMessageMessage {
  type?: 'image' | 'link' | 'text'
  image_name?: string
  upload_progress?: number
  uploaded_image_url?: string
  attachment?: FacebookBotMessageAttachment
}
