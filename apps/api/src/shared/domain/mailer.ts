export interface MailMessage {
  to: string[];
  subject: string;
  text: string;
  html: string;
}

export interface MailSendResult {
  provider: 'smtp' | 'brevo' | 'log';
  messageId?: string;
}

export abstract class AppMailer {
  abstract isConfigured(): boolean;
  abstract send(message: MailMessage): Promise<MailSendResult>;
}

export interface DispatchAlertsSummary {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

export abstract class StockAlertDispatcher {
  abstract dispatchPendingAsync(): void;
  abstract dispatchPending(notificationId?: number): Promise<DispatchAlertsSummary>;
}
