import React from 'react';

interface ReceiptProps {
  paymentDetails: {
    invoiceNumber: string;
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    transactionReference: string;
    companyName: string;
  };
}

const Receipt: React.FC<ReceiptProps> = ({ paymentDetails }) => {
  const {
    invoiceNumber,
    amountPaid,
    paymentDate,
    paymentMethod,
    transactionReference,
    companyName,
  } = paymentDetails;

  return (
    <div id="receipt-content" style={{ padding: '40px', fontFamily: 'sans-serif', color: '#333' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '2.5em', margin: 0 }}>Payment Receipt</h1>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.5em', margin: 0 }}>Ace Front-Line Security</h2>
          <p style={{ margin: '5px 0 0' }}>Your trusted security partner</p>
        </div>
      </header>

      <main style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#555' }}>Billed To</h3>
            <p style={{ margin: '5px 0 0', fontWeight: 'bold' }}>{companyName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0, color: '#555' }}>Receipt Details</h3>
            <p style={{ margin: '5px 0 0' }}><strong>Invoice #:</strong> {invoiceNumber}</p>
            <p style={{ margin: '5px 0 0' }}><strong>Payment Date:</strong> {new Date(paymentDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '30px' }}>
          <p style={{ margin: 0, fontSize: '1.2em', color: '#555' }}>Payment Status</p>
          <p style={{ margin: '10px 0', fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>
            SUCCESSFUL
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Payment for Invoice {invoiceNumber}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                LKR {amountPaid.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <div style={{ maxWidth: '60%' }}>
            <h4 style={{ color: '#555' }}>Payment Method</h4>
            <p style={{ margin: '5px 0' }}>{paymentMethod.replace(/_/g, ' ')}</p>
            {transactionReference && (
              <>
                <h4 style={{ color: '#555', marginTop: '15px' }}>Transaction Reference</h4>
                <p style={{ margin: '5px 0', fontFamily: 'monospace', fontSize: '0.9em' }}>{transactionReference}</p>
              </>
            )}
          </div>
          <div style={{ textAlign: 'right', alignSelf: 'flex-end' }}>
            <p style={{ margin: 0, fontSize: '1.5em', fontWeight: 'bold' }}>
              Total Paid: LKR {amountPaid.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </main>

      <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '0.9em', color: '#777' }}>
        <p>Thank you for your payment!</p>
        <p>Ace Front-Line Security Solutions | Colombo, Sri Lanka</p>
      </footer>
    </div>
  );
};

export default Receipt;
