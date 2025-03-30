import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '@/app/contexts/AppContext';
import { FlowLocationState } from '@/app/contexts/FlowContext';

function FlowLeftToolBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { convId } = useLocation().state as FlowLocationState;
  const { openDeleteConversationDialog, toggleSideBar, openSideBar } = useAppContext();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleDeleteConversation = () => {
    if (convId) {
      openDeleteConversationDialog(convId.toString());
    }
  };

  return (
    <div className="h-11 flex items-center gap-1 rounded-lg bg-white ring-1 ring-neutral-200 dark:ring-neutral-800 dark:bg-neutral-900">
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-center gap-[0.3rem] text-[12px] px-2"
          >
            <button
              className="flex items-center justify-center bg-neutral-200 hover:bg-neutral-200 active:bg-neutral-300 rounded-lg px-2 py-[6px] text-neutral-600 transition-colors duration-200"
              onClick={toggleSideBar}
            >
              {openSideBar ? (
                <>
                  <ChevronLeft className="w-[16px] h-[16px]" />
                  <span className="ml-1.5 font-medium">收起侧边栏</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-[16px] h-[16px]" />
                  <span className="ml-1.5 font-medium">展开侧边栏</span>
                </>
              )}
            </button>
            <button 
              className="flex items-center justify-center bg-red-100 hover:bg-red-200 active:bg-red-300 rounded-lg px-2 py-[6px] text-red-600 transition-colors duration-200"
              onClick={handleDeleteConversation}
            >
              <Trash2 className="w-[16px] h-[16px]" />
              <span className="ml-1.5 font-medium">删除会话</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 折叠按钮 */}
      <button 
        onClick={toggleCollapse} 
        className="rt-reset rt-BaseButton rt-r-size-2 rt-variant-soft rt-Button flex cursor-pointer items-center justify-center bg-transparent p-0 h-6 w-10"
      >
        <motion.svg
          width="24"
          height="24"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="hover:text-neutral-400"
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path 
            d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </motion.svg>
      </button>
    </div>
  );
}

export default FlowLeftToolBar;
