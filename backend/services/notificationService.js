const nodemailer = require('nodemailer');
const { Server } = require('socket.io');
const config = require('../config/config');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.initialized = false;
  }

  async initialize(server) {
    try {
      if (this.initialized) return;

      // Initialize email transporter
      this.emailTransporter = nodemailer.createTransporter({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password
        }
      });

      // Verify email connection
      await this.emailTransporter.verify();
      console.log('Email service connected successfully');

      // Initialize Socket.IO
      this.io = new Server(server, {
        cors: {
          origin: config.frontend.url,
          methods: ['GET', 'POST']
        }
      });

      this.setupSocketHandlers();

      this.initialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        const { userId, token } = data;
        
        // TODO: Verify JWT token here
        // For now, we'll just store the user mapping
        this.connectedUsers.set(userId, socket.id);
        this.userSockets.set(socket.id, userId);
        
        socket.join(`user_${userId}`);
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        
        socket.emit('authenticated', { success: true });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.userSockets.get(socket.id);
        if (userId) {
          this.connectedUsers.delete(userId);
          this.userSockets.delete(socket.id);
          console.log(`User ${userId} disconnected`);
        }
      });

      // Handle notification acknowledgment
      socket.on('notification_read', (data) => {
        const { notificationId } = data;
        console.log(`Notification ${notificationId} marked as read`);
        // TODO: Update notification status in database
      });
    });
  }

  // Real-time notifications
  async sendRealTimeNotification(userId, notification) {
    try {
      if (!this.io) {
        console.warn('Socket.IO not initialized, skipping real-time notification');
        return;
      }

      const socketId = this.connectedUsers.get(userId);
      
      if (socketId) {
        // Send to specific user
        this.io.to(`user_${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          timestamp: new Date().toISOString(),
          read: false
        });
        
        console.log(`Real-time notification sent to user ${userId}`);
      } else {
        console.log(`User ${userId} not connected, notification will be stored for later`);
      }
    } catch (error) {
      console.error('Send real-time notification error:', error);
    }
  }

  async broadcastNotification(notification) {
    try {
      if (!this.io) {
        console.warn('Socket.IO not initialized, skipping broadcast');
        return;
      }

      this.io.emit('broadcast_notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: new Date().toISOString()
      });
      
      console.log('Broadcast notification sent to all connected users');
    } catch (error) {
      console.error('Broadcast notification error:', error);
    }
  }

  // Email notifications
  async sendEmail(emailData) {
    try {
      const {
        to,
        subject,
        text,
        html,
        attachments = [],
        cc = [],
        bcc = []
      } = emailData;

      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html,
        attachments
      };

      if (cc.length > 0) {
        mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
      }

      if (bcc.length > 0) {
        mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
      }

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      console.log(`Email sent successfully to ${to}`);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      console.error('Send email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Invoice-related notifications
  async notifyInvoiceCreated(invoiceData) {
    try {
      const { invoice, sellerId, sellerEmail } = invoiceData;

      // Real-time notification
      await this.sendRealTimeNotification(sellerId, {
        id: `invoice_created_${invoice.id}`,
        type: 'invoice_created',
        title: 'Invoice Created Successfully',
        message: `Your invoice #${invoice.id} has been created and is pending review.`,
        data: { invoiceId: invoice.id }
      });

      // Email notification
      await this.sendEmail({
        to: sellerEmail,
        subject: `Invoice #${invoice.id} Created - CashHash`,
        html: this.generateInvoiceCreatedEmailTemplate(invoice),
        text: `Your invoice #${invoice.id} for $${invoice.amountUSD} has been created and is pending review.`
      });

      console.log(`Invoice created notifications sent for invoice ${invoice.id}`);
    } catch (error) {
      console.error('Notify invoice created error:', error);
    }
  }

  async notifyInvoiceApproved(invoiceData) {
    try {
      const { invoice, sellerId, sellerEmail } = invoiceData;

      // Real-time notification
      await this.sendRealTimeNotification(sellerId, {
        id: `invoice_approved_${invoice.id}`,
        type: 'invoice_approved',
        title: 'Invoice Approved',
        message: `Your invoice #${invoice.id} has been approved and is now available for investment.`,
        data: { invoiceId: invoice.id }
      });

      // Email notification
      await this.sendEmail({
        to: sellerEmail,
        subject: `Invoice #${invoice.id} Approved - CashHash`,
        html: this.generateInvoiceApprovedEmailTemplate(invoice),
        text: `Great news! Your invoice #${invoice.id} has been approved and is now live for investors.`
      });

      console.log(`Invoice approved notifications sent for invoice ${invoice.id}`);
    } catch (error) {
      console.error('Notify invoice approved error:', error);
    }
  }

  async notifyInvoiceRejected(invoiceData) {
    try {
      const { invoice, sellerId, sellerEmail, rejectionReason } = invoiceData;

      // Real-time notification
      await this.sendRealTimeNotification(sellerId, {
        id: `invoice_rejected_${invoice.id}`,
        type: 'invoice_rejected',
        title: 'Invoice Rejected',
        message: `Your invoice #${invoice.id} has been rejected. Reason: ${rejectionReason}`,
        data: { invoiceId: invoice.id, reason: rejectionReason }
      });

      // Email notification
      await this.sendEmail({
        to: sellerEmail,
        subject: `Invoice #${invoice.id} Rejected - CashHash`,
        html: this.generateInvoiceRejectedEmailTemplate(invoice, rejectionReason),
        text: `Your invoice #${invoice.id} has been rejected. Reason: ${rejectionReason}`
      });

      console.log(`Invoice rejected notifications sent for invoice ${invoice.id}`);
    } catch (error) {
      console.error('Notify invoice rejected error:', error);
    }
  }

  // Investment-related notifications
  async notifyInvestmentMade(investmentData) {
    try {
      const { investment, investorId, investorEmail, sellerId, sellerEmail, invoice } = investmentData;

      // Notify investor
      await this.sendRealTimeNotification(investorId, {
        id: `investment_made_${investment.id}`,
        type: 'investment_made',
        title: 'Investment Successful',
        message: `You have successfully invested $${investment.amount} in invoice #${invoice.id}.`,
        data: { investmentId: investment.id, invoiceId: invoice.id }
      });

      // Notify seller
      await this.sendRealTimeNotification(sellerId, {
        id: `investment_received_${investment.id}`,
        type: 'investment_received',
        title: 'New Investment Received',
        message: `Your invoice #${invoice.id} received a new investment of $${investment.amount}.`,
        data: { investmentId: investment.id, invoiceId: invoice.id }
      });

      // Email to investor
      await this.sendEmail({
        to: investorEmail,
        subject: `Investment Confirmation - Invoice #${invoice.id}`,
        html: this.generateInvestmentConfirmationEmailTemplate(investment, invoice),
        text: `Your investment of $${investment.amount} in invoice #${invoice.id} has been confirmed.`
      });

      // Email to seller
      await this.sendEmail({
        to: sellerEmail,
        subject: `New Investment - Invoice #${invoice.id}`,
        html: this.generateNewInvestmentEmailTemplate(investment, invoice),
        text: `Your invoice #${invoice.id} received a new investment of $${investment.amount}.`
      });

      console.log(`Investment notifications sent for investment ${investment.id}`);
    } catch (error) {
      console.error('Notify investment made error:', error);
    }
  }

  // Payment-related notifications
  async notifyPaymentReceived(paymentData) {
    try {
      const { payment, invoice, investorIds, investorEmails } = paymentData;

      // Notify all investors
      for (const investorId of investorIds) {
        await this.sendRealTimeNotification(investorId, {
          id: `payment_received_${payment.id}`,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment of $${payment.amount} received for invoice #${invoice.id}. Your payout is being processed.`,
          data: { paymentId: payment.id, invoiceId: invoice.id }
        });
      }

      // Email to all investors
      for (const email of investorEmails) {
        await this.sendEmail({
          to: email,
          subject: `Payment Received - Invoice #${invoice.id}`,
          html: this.generatePaymentReceivedEmailTemplate(payment, invoice),
          text: `Payment of $${payment.amount} has been received for invoice #${invoice.id}.`
        });
      }

      console.log(`Payment received notifications sent for payment ${payment.id}`);
    } catch (error) {
      console.error('Notify payment received error:', error);
    }
  }

  async notifyPayoutProcessed(payoutData) {
    try {
      const { payout, investorId, investorEmail, invoice } = payoutData;

      // Real-time notification
      await this.sendRealTimeNotification(investorId, {
        id: `payout_processed_${payout.id}`,
        type: 'payout_processed',
        title: 'Payout Processed',
        message: `Your payout of $${payout.amount} for invoice #${invoice.id} has been processed.`,
        data: { payoutId: payout.id, invoiceId: invoice.id }
      });

      // Email notification
      await this.sendEmail({
        to: investorEmail,
        subject: `Payout Processed - Invoice #${invoice.id}`,
        html: this.generatePayoutProcessedEmailTemplate(payout, invoice),
        text: `Your payout of $${payout.amount} for invoice #${invoice.id} has been processed.`
      });

      console.log(`Payout processed notifications sent for payout ${payout.id}`);
    } catch (error) {
      console.error('Notify payout processed error:', error);
    }
  }

  // System notifications
  async notifySystemMaintenance(maintenanceData) {
    try {
      const { startTime, endTime, description } = maintenanceData;

      await this.broadcastNotification({
        id: `maintenance_${Date.now()}`,
        type: 'system_maintenance',
        title: 'Scheduled Maintenance',
        message: `System maintenance scheduled from ${startTime} to ${endTime}. ${description}`,
        data: { startTime, endTime, description }
      });

      console.log('System maintenance notification broadcasted');
    } catch (error) {
      console.error('Notify system maintenance error:', error);
    }
  }

  // Email templates
  generateInvoiceCreatedEmailTemplate(invoice) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Invoice Created Successfully</h2>
        <p>Dear Seller,</p>
        <p>Your invoice has been successfully created and submitted for review.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details:</h3>
          <p><strong>Invoice ID:</strong> #${invoice.id}</p>
          <p><strong>Amount:</strong> $${invoice.amountUSD}</p>
          <p><strong>Buyer:</strong> ${invoice.buyerName}</p>
          <p><strong>Tenor:</strong> ${invoice.tenorDays} days</p>
          <p><strong>Yield:</strong> ${invoice.yieldBps / 100}%</p>
        </div>
        <p>We will review your invoice and notify you once it's approved for investment.</p>
        <p>Best regards,<br>CashHash Team</p>
      </div>
    `;
  }

  generateInvoiceApprovedEmailTemplate(invoice) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Invoice Approved! 🎉</h2>
        <p>Dear Seller,</p>
        <p>Great news! Your invoice has been approved and is now live for investors.</p>
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details:</h3>
          <p><strong>Invoice ID:</strong> #${invoice.id}</p>
          <p><strong>Amount:</strong> $${invoice.amountUSD}</p>
          <p><strong>Expected Yield:</strong> ${invoice.yieldBps / 100}%</p>
        </div>
        <p>Investors can now view and invest in your invoice. You'll receive notifications as investments come in.</p>
        <p>Best regards,<br>CashHash Team</p>
      </div>
    `;
  }

  generateInvoiceRejectedEmailTemplate(invoice, reason) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Invoice Rejected</h2>
        <p>Dear Seller,</p>
        <p>Unfortunately, your invoice has been rejected during our review process.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details:</h3>
          <p><strong>Invoice ID:</strong> #${invoice.id}</p>
          <p><strong>Amount:</strong> $${invoice.amountUSD}</p>
          <p><strong>Rejection Reason:</strong> ${reason}</p>
        </div>
        <p>Please review the rejection reason and feel free to resubmit your invoice after addressing the issues.</p>
        <p>Best regards,<br>CashHash Team</p>
      </div>
    `;
  }

  generateInvestmentConfirmationEmailTemplate(investment, invoice) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Investment Confirmed! 🎯</h2>
        <p>Dear Investor,</p>
        <p>Your investment has been successfully processed.</p>
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Investment Details:</h3>
          <p><strong>Investment Amount:</strong> $${investment.amount}</p>
          <p><strong>Invoice ID:</strong> #${invoice.id}</p>
          <p><strong>Expected Return:</strong> ${invoice.yieldBps / 100}%</p>
          <p><strong>Maturity Date:</strong> ${new Date(invoice.maturityDate).toLocaleDateString()}</p>
        </div>
        <p>You will receive notifications about payment updates and your payout when the invoice matures.</p>
        <p>Best regards,<br>CashHash Team</p>
      </div>
    `;
  }

  generateNewInvestmentEmailTemplate(investment, invoice) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">New Investment Received! 💰</h2>
        <p>Dear Seller,</p>
        <p>Your invoice has received a new investment.</p>
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Investment Details:</h3>
          <p><strong>Investment Amount:</strong> $${investment.amount}</p>
          <p><strong>Invoice ID:</strong> #${invoice.id}</p>
          <p><strong>Total Invested:</strong> $${invoice.totalInvested || investment.amount}</p>
        </div>
        <p>Thank you for using CashHash for your invoice financing needs.</p>
        <p>Best regards,<br>CashHash Team</p>
      </div>
    `;
  }

  generatePaymentReceivedEmailTemplate(payment, invoice) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Received! 💸</h2>
        <p>Dear Investor,</p>
        <p>Payment has been received for your investment.</p>
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Details:</h3>
          <p><strong>Payment Amount:</strong> $${payment.amount}</p>
          <p><strong>Invoice ID:</strong> #${invoice.id}</p>
          <p><strong>Payment Date:</strong> ${new Date(payment.receivedAt).toLocaleDateString()}</p>
        </div>
        <p>Your payout is being processed and will be available shortly.</p>
        <p>Best regards,<br>CashHash Team</p>
      </div>
    `;
  }

  generatePayoutProcessedEmailTemplate(payout, invoice) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payout Processed! 🎉</h2>
        <p>Dear Investor,</p>
        <p>Your payout has been successfully processed.</p>
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payout Details:</h3>
          <p><strong>Payout Amount:</strong> $${payout.amount}</p>
          <p><strong>Invoice ID:</strong> #${invoice.id}</p>
          <p><strong>Processing Date:</strong> ${new Date(payout.processedAt).toLocaleDateString()}</p>
        </div>
        <p>The funds have been transferred to your account. Thank you for investing with CashHash!</p>
        <p>Best regards,<br>CashHash Team</p>
      </div>
    `;
  }

  // Utility methods
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  async testEmailConnection() {
    try {
      await this.emailTransporter.verify();
      return { success: true, message: 'Email connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new NotificationService();