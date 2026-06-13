import { Router } from 'express';
import { 
  handleAssistantChat, 
  getAssistantHistory, 
  getConversationDetails, 
  deleteConversation, 
  createNewConversation,
  updateConversationSettings 
} from '../controllers/assistant.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Secure all endpoints with Auth middleware
router.use(authenticateToken as any);

router.post('/chat', handleAssistantChat as any);
router.get('/history', getAssistantHistory as any);
router.get('/conversation/:id', getConversationDetails as any);
router.delete('/conversation/:id', deleteConversation as any);
router.post('/new-conversation', createNewConversation as any);
router.patch('/conversation/:id', updateConversationSettings as any);

export default router;
