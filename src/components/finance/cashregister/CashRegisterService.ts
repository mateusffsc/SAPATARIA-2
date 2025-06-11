export interface CashRegisterSession {
  id: number;
  opened_at: string;
  closed_at?: string;
  opening_amount: number;
  closing_amount?: number;
  expected_amount?: number;
  difference?: number;
  opened_by: string;
  closed_by?: string;
  status: 'open' | 'closed';
  notes?: string;
}

interface CashRegisterOperation {
  id: number;
  session_id: number;
  type: 'opening' | 'closing' | 'adjustment' | 'income' | 'expense';
  amount: number;
  description: string;
  created_by: string;
  created_at: string;
}

export class CashRegisterService {
  static async getCurrentSession(): Promise<CashRegisterSession | null> {
    // Simulate API call - replace with actual Supabase call
    const sessions = JSON.parse(localStorage.getItem('cash_sessions') || '[]');
    return sessions.find((s: CashRegisterSession) => s.status === 'open') || null;
  }

  static async openCashRegister(openingAmount: number, openedBy: string): Promise<CashRegisterSession> {
    const newSession: CashRegisterSession = {
      id: Date.now(),
      opened_at: new Date().toISOString(),
      opening_amount: openingAmount,
      opened_by: openedBy,
      status: 'open'
    };

    const sessions = JSON.parse(localStorage.getItem('cash_sessions') || '[]');
    sessions.push(newSession);
    localStorage.setItem('cash_sessions', JSON.stringify(sessions));

    return newSession;
  }

  static async closeCashRegister(
    sessionId: number, 
    closingAmount: number, 
    closedBy: string,
    notes?: string
  ): Promise<CashRegisterSession> {
    const sessions = JSON.parse(localStorage.getItem('cash_sessions') || '[]');
    const sessionIndex = sessions.findIndex((s: CashRegisterSession) => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Sessão de caixa não encontrada');
    }

    const session = sessions[sessionIndex];
    const expectedAmount = session.opening_amount; // + calculated transactions
    const difference = closingAmount - expectedAmount;

    sessions[sessionIndex] = {
      ...session,
      closed_at: new Date().toISOString(),
      closing_amount: closingAmount,
      expected_amount: expectedAmount,
      difference,
      closed_by: closedBy,
      status: 'closed',
      notes
    };

    localStorage.setItem('cash_sessions', JSON.stringify(sessions));
    return sessions[sessionIndex];
  }

  static async getCashBalance(): Promise<number> {
    const currentSession = await this.getCurrentSession();
    if (!currentSession) return 0;

    // Calculate current balance based on opening amount + cash transactions
    // This would integrate with financial transactions
    return currentSession.opening_amount;
  }

  static async validateAdminPassword(password: string): Promise<boolean> {
    // In production, this should be properly secured
    return password === 'admin123';
  }

  static async recordOperation(operation: Omit<CashRegisterOperation, 'id' | 'created_at'>): Promise<CashRegisterOperation> {
    const sessions = JSON.parse(localStorage.getItem('cash_sessions') || '[]');
    const session = sessions.find((s: CashRegisterSession) => s.id === operation.session_id);
    
    if (!session) {
      throw new Error('Sessão de caixa não encontrada');
    }

    if (session.status === 'closed') {
      throw new Error('Não é possível registrar operações em uma sessão fechada');
    }

    const newOperation = {
      ...operation,
      id: Date.now(),
      created_at: new Date().toISOString()
    };

    const operations = JSON.parse(localStorage.getItem('cash_operations') || '[]');
    operations.push(newOperation);
    localStorage.setItem('cash_operations', JSON.stringify(operations));

    return newOperation;
  }
}