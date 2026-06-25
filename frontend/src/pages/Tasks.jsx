
import TaskBoard from '../components/TaskBoard';
import { motion } from 'framer-motion';

export default function Tasks() {
  return (
    <div className="p-8 ">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 ">My Tasks</h1>
        <p className="text-gray-400">Manage your assigned tasks and track progress.</p>
      </motion.div>
      
      <TaskBoard />
    </div>
  );
}
