import React, { useState } from 'react';
import { useWorksheetStore } from '../store/worksheet';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { FileText, Trash2, CheckSquare, Square, Eye, X } from 'lucide-react';
import { clsx } from 'clsx';

const HistoryPage: React.FC = () => {
  const { 
    history, 
    currentHistoryIndex, 
    setHistoryIndex, 
    clearHistory,
    removeHistoryItem,
    removeHistoryItems,
    setHtmlContent
  } = useWorksheetStore();

  const navigate = useNavigate();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleView = (index: number) => {
    setHistoryIndex(index);
    setHtmlContent(history[index].htmlContent);
    navigate('/preview');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) {
      removeHistoryItems(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">历史记录</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            共 {history.length} 条记录
          </p>
        </div>
        
        {history.length > 0 && (
          <div className="flex gap-2">
            {!isSelectionMode ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsSelectionMode(true)}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  选择
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                  onClick={() => {
                    if(confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
                      clearHistory();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
                {selectedIds.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除 ({selectedIds.length})
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 dark:bg-slate-900/40 dark:border-slate-800">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4 dark:text-slate-600" />
          <p className="text-gray-500 dark:text-slate-400">暂无历史记录</p>
          <p className="text-sm text-gray-400 mt-2 dark:text-slate-500">生成的练习单将自动保存到这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, index) => (
            <div 
              key={item.id}
              className={clsx(
                "group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                currentHistoryIndex === index 
                  ? "bg-blue-50 border-blue-200 dark:bg-slate-900/60 dark:border-slate-700" 
                  : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm dark:bg-slate-900/40 dark:border-slate-800 dark:hover:border-slate-700"
              )}
              onClick={() => {
                if (isSelectionMode) {
                  toggleSelection(item.id);
                } else {
                  handleView(index);
                }
              }}
            >
              {isSelectionMode && (
                <div 
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(item.id);
                  }}
                >
                  {selectedIds.includes(item.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              )}

              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center dark:bg-slate-800">
                <FileText className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate max-w-[200px]">
                    {item.metadata?.title || item.originalText?.substring(0, 40) || `练习单 #${history.length - index}`}
                    {((item.metadata?.title?.length || 0) > 40 || (item.originalText?.length || 0) > 40) && '...'}
                  </span>
                  {currentHistoryIndex === index && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                      当前
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                  <span>{formatDate(item.timestamp)}</span>
                  {item.metadata?.cefrLevel && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded dark:bg-green-900/40 dark:text-green-300">
                        {item.metadata.cefrLevel}
                      </span>
                    </>
                  )}
                  {item.metadata?.grade && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded dark:bg-purple-900/40 dark:text-purple-300">
                        {item.metadata.grade === 'elementary' ? '小学' :
                         item.metadata.grade === 'middle' ? '初中' :
                         item.metadata.grade === 'high' ? '高中' : item.metadata.grade}
                      </span>
                    </>
                  )}
                  {item.settings?.articleCount > 1 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span>{item.settings.articleCount} 篇文章</span>
                    </>
                  )}
                </div>
                {/* Article summaries */}
                {item.metadata?.articleSummaries && item.metadata.articleSummaries.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {item.metadata.articleSummaries.slice(0, 3).map((article, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">文章 {idx + 1}:</span>
                        <span className="text-gray-600 dark:text-slate-400 truncate max-w-[250px]">
                          {article.title || '无标题'}
                        </span>
                        {article.cefrLevel && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded dark:bg-slate-800 dark:text-slate-400">
                            {article.cefrLevel}
                          </span>
                        )}
                      </div>
                    ))}
                    {item.metadata.articleSummaries.length > 3 && (
                      <span className="text-xs text-gray-400">+{item.metadata.articleSummaries.length - 3} 篇</span>
                    )}
                  </div>
                )}
              </div>

              {!isSelectionMode && (
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(index);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  查看
                </button>
              )}

              {!isSelectionMode && (
                <button
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('确定要删除这条记录吗？')) {
                      removeHistoryItem(item.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
