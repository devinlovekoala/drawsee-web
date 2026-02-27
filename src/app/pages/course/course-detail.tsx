import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpenCheck, CalendarDays, CircuitBoard, ClipboardList, FileText, Loader2, PenLine, Rocket, Users } from 'lucide-react';
import { getCourseDetail, getCourseResources } from '@/api/methods/course.methods';
import { CourseResourceType, CourseResourceVO, CourseVO } from '@/api/types/course.types';
import { toast } from 'sonner';

const RESOURCE_TABS: { type: CourseResourceType; label: string; icon: React.ElementType }[] = [
  { type: 'COURSEWARE', label: '课件', icon: FileText },
  { type: 'TASK', label: '任务布置', icon: ClipboardList },
  { type: 'CIRCUIT_REF', label: '参考电路图', icon: CircuitBoard }
];

const isCircuitAnalysisCourse = (course?: CourseVO | null) => {
  if (!course) return false;
  const subjectCheck = [
    'CIRCUIT_ANALYSIS',
    'circuit_analysis',
    'CircuitAnalysis',
    '电路分析',
    '电子电路分析'
  ].includes(course.subject);
  const nameCheck = ['电路分析', '电子电路', 'circuit', 'Circuit', 'CIRCUIT'].some(keyword =>
    course.name?.includes(keyword)
  );
  return subjectCheck || nameCheck;
};

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseVO | null>(null);
  const [resources, setResources] = useState<CourseResourceVO[]>([]);
  const [activeType, setActiveType] = useState<CourseResourceType>('COURSEWARE');
  const [loading, setLoading] = useState(true);

  const headerStats = useMemo(() => {
    if (!course) return [] as { label: string; value: string }[];
    return [
      { label: '学生人数', value: `${course.studentCount ?? 0}` },
      { label: '知识库', value: `${course.knowledgeBases?.length ?? 0}` },
      { label: '课程科目', value: course.subject || '-' }
    ];
  }, [course]);

  useEffect(() => {
    if (!id) return;
    const loadDetail = async () => {
      try {
        const detail = await getCourseDetail(id);
        setCourse(detail);
      } catch (error) {
        console.error('获取班级详情失败:', error);
        toast.error('获取班级详情失败');
      }
    };
    loadDetail();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loadResources = async () => {
      setLoading(true);
      try {
        const data = await getCourseResources(id, activeType);
        setResources(data || []);
      } catch (error) {
        console.error('获取资源失败:', error);
        toast.error('获取资源失败');
      } finally {
        setLoading(false);
      }
    };
    loadResources();
  }, [id, activeType]);

  const goToChat = () => {
    if (!course) return;
    navigate('/blank', {
      state: {
        agentType: 'GENERAL',
        agentName: course.name || '昭析智能助手',
        classId: course.id
      }
    });
  };

  const goToCircuit = () => {
    if (!course) return;
    navigate('/circuit', {
      state: {
        classId: course.id
      }
    });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-100 p-2">
                  <BookOpenCheck className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">{course?.name || '班级详情'}</h1>
                  <p className="text-sm text-slate-500">{course?.description || '暂无课程描述'}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                {headerStats.map(stat => (
                  <div key={stat.label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    {stat.label}：<span className="font-medium text-slate-800">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={goToChat}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white shadow-sm hover:bg-slate-800"
              >
                <PenLine className="h-4 w-4" />
                进入对话学习
              </button>
              <button
                onClick={goToCircuit}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                <CircuitBoard className="h-4 w-4" />
                电路实验
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-700 mb-3">班级功能</div>
            <div className="flex flex-col gap-2">
              {RESOURCE_TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeType === tab.type;
                return (
                  <button
                    key={tab.type}
                    onClick={() => setActiveType(tab.type)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      active ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </span>
                    {active && <Rocket className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700">
              学生点击资源可直接打开详情或外部链接。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{RESOURCE_TABS.find(tab => tab.type === activeType)?.label}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="h-4 w-4" />
                仅班级成员可见
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="mt-2 text-sm">加载中...</span>
              </div>
            ) : resources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
                暂无内容，老师稍后会补充。
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map(resource => (
                  <div key={resource.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{resource.title}</h3>
                        {resource.description && (
                          <p className="mt-1 text-sm text-slate-600">{resource.description}</p>
                        )}
                      </div>
                      {resource.dueAt && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          截止 {new Date(resource.dueAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {resource.content && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                        {resource.content}
                      </div>
                    )}

                    {resource.fileUrl && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          打开课件
                        </a>
                        {resource.fileName && (
                          <span className="text-xs text-slate-500">{resource.fileName}</span>
                        )}
                      </div>
                    )}

                    {resource.coverUrl && (
                      <div className="mt-3">
                        <img
                          src={resource.coverUrl}
                          alt={resource.title}
                          className="w-full max-h-64 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
