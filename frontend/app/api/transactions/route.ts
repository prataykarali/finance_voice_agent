import { NextResponse } from 'next/server';
import { getTransactions, createTransaction } from '@/lib/store';
import { proxyGet, proxyPost } from '@/lib/backend';

export const dynamic = 'force-dynamic';

export async function GET() {
  const proxied = await proxyGet('/api/transactions');
  if (proxied && Array.isArray(proxied)) {
    return NextResponse.json(proxied);
  }

  const transactions = getTransactions();
  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.requester_name || !body.amount_inr) {
      return NextResponse.json(
        { error: 'requester_name and amount_inr are required' },
        { status: 400 },
      );
    }

    const proxied = await proxyPost('/api/transactions', body);
    if (proxied && proxied.ok) {
      return NextResponse.json(proxied.data);
    }

    const tx = createTransaction({
      user_id: body.user_id || body.requester_name.toLowerCase().replace(/\s+/g, '_'),
      requester_name: body.requester_name,
      transaction_type: body.transaction_type || 'TRANSFER',
      amount_inr: Number(body.amount_inr),
      recipient_account: body.recipient_account,
      recipient_name: body.recipient_name,
      safe_key: body.safe_key,
      requires_approval: body.requires_approval,
      notes: body.notes,
    });

    return NextResponse.json({
      ok: true,
      transaction: tx,
      message:
        tx.status === 'PENDING_MANAGER_APPROVAL'
          ? `Transaction ${tx.transaction_id} submitted for Senior Manager approval.`
          : `Transaction ${tx.transaction_id} completed successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create transaction' }, { status: 500 });
  }
}
