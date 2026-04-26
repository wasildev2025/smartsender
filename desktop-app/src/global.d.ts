export {};

type Unsubscribe = () => void;

export type WaStatus = {
  status: 'INITIALIZING' | 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATED' | 'READY';
  qr?: string;
  number?: string | null;
  info?: unknown;
  error?: string;
  reason?: string;
};

export type SendResult =
  | { success: true; number: string; result?: unknown }
  | { success: false; number?: string; error: string };

export type LicenseStatus = {
  valid: boolean;
  expiresAt: string | null;
  features: string[];
  offlineGraceRemainingMs?: number;
};

declare global {
  interface Window {
    smartsender: {
      wa: {
        getStatus: () => Promise<WaStatus>;
        sendMessage: (number: string, text: string) => Promise<SendResult>;
        sendPoll: (number: string, question: string, options: string[], allowMultiple?: boolean) => Promise<SendResult>;
        getChats: () => Promise<Array<{ id: string; name: string; isGroup: boolean; unreadCount: number }>>;
        getGroupMembers: (groupId: string) => Promise<Array<{ id: string; number: string; isAdmin: boolean }>>;
        joinGroup: (inviteCode: string) => Promise<{ success: boolean; groupId?: string; error?: string }>;
        createGroup: (name: string, numbers: string[]) => Promise<{ success: boolean; gid?: string; error?: string }>;
        addParticipants: (groupId: string, numbers: string[]) => Promise<{ success: boolean; result?: unknown; error?: string }>;
        removeParticipants: (groupId: string, numbers: string[]) => Promise<{ success: boolean; error?: string }>;
        leaveGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>;
        checkNumber: (number: string) => Promise<{ number: string; isRegistered: boolean; error?: string }>;
        setAutoResponder: (rules: unknown[]) => Promise<{ success: boolean }>;
        getAutoResponder: () => Promise<Array<{ id?: string; keyword: string; matchType: 'exact' | 'contains'; replyText: string }>>;
        logout: () => Promise<{ success: boolean }>;
        onStatus: (cb: (s: WaStatus) => void) => Unsubscribe;
      };
      db: {
        getDashboardData: () => Promise<{ totalSent: number; history: Array<{ id: string; name: string; status: string; sent: number; total: number; date: string }> }>;
        recordCampaign: (c: unknown) => Promise<void>;
        incrementSent: (n: number) => Promise<void>;
        deleteCampaign: (id: string) => Promise<{ success: boolean; error?: string }>;
      };
      license: {
        activate: (key: string) => Promise<LicenseStatus & { error?: string }>;
        status: () => Promise<LicenseStatus>;
        deactivate: () => Promise<{ success: boolean }>;
        onUpdate: (cb: (s: LicenseStatus) => void) => Unsubscribe;
      };
      system: {
        getMachineId: () => Promise<string | null>;
      };
    };
  }
}
