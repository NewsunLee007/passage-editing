import React from 'react';
import { Info, BookOpen, Layers, Zap, Heart, Settings, FileText, Edit3, Eye, Download } from 'lucide-react';

const About: React.FC = () => {
  const steps = [
    { icon: Settings, title: '配置 AI', desc: '在「设置」页面配置您的 AI API 密钥（DeepSeek/OpenAI/Claude等）' },
    { icon: FileText, title: '输入文本', desc: '在「生成」页面粘贴文章、上传图片/PDF，或输入网页链接' },
    { icon: Zap, title: '选择难度', desc: '选择适合的 CEFR 等级（A1-C2）和题型，点击生成' },
    { icon: Edit3, title: '编辑内容', desc: '在「编辑」页面调整文章、词汇、练习题等内容' },
    { icon: Eye, title: '预览排版', desc: '在「预览」页面调整行高、字号、页边距等布局' },
    { icon: Download, title: '导出打印', desc: '下载 HTML 文件或直接打印为 PDF，即可分发给学生' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight dark:text-slate-100">
          关于 <span className="text-blue-600">ESL阅读材料 智能生成</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-slate-400">
          专为英语教师打造的文本改编神器，让分级阅读材料制作变得简单高效。
        </p>
      </div>

      {/* 操作步骤 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mb-16 dark:from-slate-900/60 dark:to-slate-900/40 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center dark:text-slate-100">
          快速上手指南
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm dark:bg-slate-800">
                <step.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow dark:bg-slate-900/60 dark:border-slate-800">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 dark:bg-blue-900/40">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 dark:text-slate-100">科学分级 (CEFR Aligned)</h3>
          <p className="text-gray-600 leading-relaxed dark:text-slate-400">
            严格遵循欧洲语言共同参考框架 (CEFR)，从 A1 入门到 C2 精通，自动调整词汇难度、句法结构和文本长度，确保材料完美匹配学生水平。
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow dark:bg-slate-900/60 dark:border-slate-800">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 dark:bg-green-900/40">
            <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 dark:text-slate-100">智能生成 (AI Powered)</h3>
          <p className="text-gray-600 leading-relaxed dark:text-slate-400">
            集成全球顶尖大模型（DeepSeek, OpenAI, Claude, Gemini），一键将新闻、故事转化为包含词汇表、阅读理解、语法填空的完整练习单。
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow dark:bg-slate-900/60 dark:border-slate-800">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 dark:bg-purple-900/40">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 dark:text-slate-100">即用型设计 (Ready to Use)</h3>
          <p className="text-gray-600 leading-relaxed dark:text-slate-400">
            生成的练习单自动排版为 A4 打印格式，无需二次编辑。支持直接预览、下载 HTML 或打印为 PDF，从生成到分发仅需几分钟。
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow dark:bg-slate-900/60 dark:border-slate-800">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 dark:bg-orange-900/40">
            <Heart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 dark:text-slate-100">开源免费 (Free & Open)</h3>
          <p className="text-gray-600 leading-relaxed dark:text-slate-400">
            本项目完全开源，支持私有化部署。所有数据处理均在本地完成，充分保护您的教学资料隐私，无需担心数据泄露。
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
