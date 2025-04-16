import { findMyProfile } from './UserService';

const API_URL = 'http://localhost:5000';

// Map method and URL patterns to human-readable descriptions
const descriptionMap = {
  POST: {
    '/users/register': 'registered a new account',
    '/users/login': 'logged in',
    '/users/logout': 'logged out',
    '/users/addemployee': 'added an employee',
    '/users/upload-employees': 'uploaded employees from Excel',
    '/users/registerwithproject': 'registered with a project',
    '/users/registermanager': 'registered a manager',
    '/assetsactifs': 'created an active asset',
    '/assetspassifs': 'created a passive asset',
    '/invoices/create': 'created an invoice',
    '/invoices/send/:invoiceId': 'sent an invoice',
    '/objectif/createobjectifs': 'created an objective',
    '/project/addproject/:businessManagerId': 'created a project',
    '/project/assignAccountantToProject/:accountantId': 'assigned an accountant to a project',
    '/project/assignFinancialManagerToProject/:financialManagerId': 'assigned a financial manager to a project',
    '/project/assignRHManagerToProject/:rhId': 'assigned an HR manager to a project',
    '/project/unassignaccountant/:accountantId': 'unassigned an accountant from a project',
    '/project/unassignfinancialmanager/:financialManagerId': 'unassigned a financial manager from a project',
    '/project/unassignrh/:rhId': 'unassigned an HR manager from a project',
    '/taxes/taxes': 'created a tax record',
    '/taxes/obligations-fiscales': 'created a fiscal obligation',
    '/taxes/tranches-imposition': 'created an imposition tranche',
    '/transactions/deposit/:walletId': 'deposited money to a wallet',
    '/transactions/withdraw/:walletId': 'withdrew money from a wallet',
    '/transactions/transfer/:senderWalletId/:receiverWalletId': 'transferred money between wallets',
    '/wallets/addWallet': 'created a wallet',
  },
  PUT: {
    '/users/updateprofile': 'updated their profile',
    '/users/updatebyid/:id': 'updated a user profile',
    '/users/acceptAutorisation/:id': 'accepted authorization for a user',
    '/users/update-firstlogin': 'updated first login status',
    '/assetsactifs/:id': 'updated an active asset',
    '/assetspassifs/:id': 'updated a passive asset',
    '/invoices/:invoiceId/accept': 'accepted an invoice',
    '/objectif/complete/:objectifId': 'marked an objective as completed',
    '/objectif/fail/:objectifId': 'marked an objective as failed',
    '/objectif/updateobjectif/:objectifId': 'updated an objective',
    '/objectif/updateProgress/:objectifId': 'updated progress on an objective',
    '/project/updateproject/:id': 'updated a project',
    '/taxes/taxes/:id': 'updated a tax record',
    '/taxes/obligations-fiscales/:id': 'updated a fiscal obligation',
    '/taxes/tranches-imposition/:id': 'updated an imposition tranche',
    '/transactions/cancelTransaction/:transactionId': 'canceled a transaction',
    '/transactions/updateTransaction/:transactionId': 'updated a transaction',
    '/wallets/:walletId': 'updated a wallet',
  },
  DELETE: {
    '/users/deletemyprofil': 'deleted their profile',
    '/users/deletebyid': 'deleted a user profile',
    '/users/deletbyid/:id': 'deleted a user by ID',
    '/assetsactifs/:id': 'deleted an active asset',
    '/assetspassifs/:id': 'deleted a passive asset',
    '/objectif/deletobjectif/:objectifId': 'deleted an objective',
    '/project/deleteProjectById/:id': 'deleted a project',
    '/wallets/deleteWallet/:walletId': 'deleted a wallet',
  },
};

// Get description based on method and URL
const getActionDescription = (method, url) => {
  const methodMap = descriptionMap[method];
  if (!methodMap) return `${method.toLowerCase()} action on ${url.split('/').pop()}`; // Fallback for unsupported methods

  // Find the closest matching URL pattern
  for (const [pattern, description] of Object.entries(methodMap)) {
    // Replace dynamic segments (e.g., :id) with regex for matching
    const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
    if (new RegExp(`^${regexPattern}$`).test(url)) {
      return description;
    }
  }

  // Fallback if no specific match
  return `${method.toLowerCase()} action on ${url.split('/').pop()}`;
};

const getLogsByProject = async (projectId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/logs/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'cache-control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Filter for POST, PUT, DELETE methods
    const filteredData = data.filter(log => ['POST', 'PUT', 'DELETE'].includes(log.method));

    // Map logs to include user details and description
    const logs = await Promise.all(
      filteredData.map(async (log, index) => {
        let userData = { fullname: log.userId || 'Unknown User', department: 'Unknown' };
        try {
          const userProfile = await findMyProfile(log.userId); // Assumes findMyProfile accepts userId
          userData = {
            fullname:
              `${userProfile.lastname + ' '} ${userProfile.fullname || ' '}`.trim() ||
              'Unknown User',
            department: userProfile.role || 'Unknown',
          };
        } catch (err) {
          console.warn(`Failed to fetch user ${log.userId}:`, err);
        }
        return {
          id: log._id || index.toString(),
          userId: log.userId,
          user: {
            name: userData.fullname,
            department: userData.department,
          },
          description: getActionDescription(log.method, log.url),
          timestamp: log.timestamp,
          method: log.method,
          url: log.url,
          statusCode: log.statusCode,
          responseTime: log.responseTime,
        };
      })
    );

    console.log('Mapped logs in service:', logs);
    return logs;
  } catch (error) {
    console.error('Error fetching logs by project:', error.message);
    throw error;
  }
};

export default {
  getLogsByProject,
};