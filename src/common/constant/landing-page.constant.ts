export interface LandingFeatureItem {
  title: string;
  description: string;
}

export interface LandingWorkflowStep {
  title: string;
  description: string;
}

export interface LandingCapabilityItem {
  title: string;
  description: string;
  tag: string;
}

export interface LandingBenefitItem {
  title: string;
  description: string;
}

export interface LandingTestimonialItem {
  quote: string;
  author: string;
  title: string;
  avatar: string;
}

export const landingHeroStats = [
  {
    value: '12+',
    label: '任务类型'
  },
  {
    value: 'Java Agent',
    label: '后端自研工作流'
  },
  {
    value: 'SSE',
    label: '流式响应更新'
  }
];

export const landingFeatures: LandingFeatureItem[] = [
  {
    title: '智能交互编排',
    description: '系统自动识别问题意图与上下文，不再依赖手动模式切换，按任务类型智能分发最合适的处理链路。'
  },
  {
    title: '班级知识库增强答疑',
    description: '教师为班级配置知识库后，学生在班级上下文中可获得稳定、贴合课程目标的日常答疑与知识延展支持。'
  },
  {
    title: '电路工程实践闭环',
    description: '覆盖从实验任务理解到电路分析的完整流程，支持电路推导、电路细节展开与工程化实践问答。'
  },
  {
    title: '在线电路仿真与波形观察',
    description: '支持模拟与数字电路在线仿真，实时查看示波器波形、逻辑电平与信号变化，增强实验验证能力。'
  },
  {
    title: 'PDF 电路实验文档解析',
    description: '针对电子电路实验文档自动生成分析点并支持深度展开，帮助学生从任务文本快速进入实验思考。'
  },
  {
    title: '多模型协同',
    description: '支持 DeepSeekV3、豆包等模型，按任务语境协同调用，在推理、教学答疑和工程分析场景中保持质量稳定。'
  },
  {
    title: '流式任务反馈',
    description: '基于事件流的节点增量更新机制，前端可实时接收任务进展、文本输出与结果完成信号。'
  }
];

export const landingWorkflowSteps: LandingWorkflowStep[] = [
  {
    title: '理解上下文',
    description: '结合当前对话树、历史节点和班级信息识别问题语义。'
  },
  {
    title: '自动路由任务',
    description: '根据任务类型自动分配到通用答疑、知识库增强、电路分析或文档解析链路。'
  },
  {
    title: '流式输出结果',
    description: '通过流式事件持续返回分析节点与文本内容，帮助用户边看边追问。'
  }
];

export const landingCapabilities: LandingCapabilityItem[] = [
  {
    title: '通用学习答疑',
    description: '覆盖概念解释、题目理解与思路拆分，适配日常学习问答。',
    tag: 'GENERAL'
  },
  {
    title: '班级知识库答疑',
    description: '依托教师配置的课程知识库，提供更贴合课堂语境的回答。',
    tag: 'KNOWLEDGE'
  },
  {
    title: '推理解题链路',
    description: '按步骤组织推理与结论，帮助学生掌握解题过程而非只看答案。',
    tag: 'SOLVER'
  },
  {
    title: '电路分析与细化',
    description: '支持电路分析点生成与细节展开，服务电路工程实践场景。',
    tag: 'CIRCUIT'
  },
  {
    title: '实时仿真与波形观察',
    description: '支持模拟电路、数字逻辑与示波器波形可视化，帮助学生验证电路行为与设计思路。',
    tag: 'SIMULATION'
  },
  {
    title: 'PDF 实验任务解析',
    description: '对电路实验文档进行任务拆解、分析点提取与逐点深入解释。',
    tag: 'PDF_CIRCUIT'
  },
  {
    title: '动画辅助表达',
    description: '将抽象概念转化为更易理解的动态表达，提升教学可解释性。',
    tag: 'ANIMATION'
  }
];

export const landingBenefits: LandingBenefitItem[] = [
  {
    title: '从手动选择到智能编排',
    description: '用户无需判断该选什么模式，系统会自动识别问题类型并组织最优交互路径。'
  },
  {
    title: '教师与学生同一知识语境',
    description: '教师配置班级知识库后，学生提问能够直接继承课程语境，提升答疑一致性与教学落地效果。'
  },
  {
    title: '答疑与仿真一体化',
    description: '把理论问答、文档解析、仿真验证与电路分析串成连续学习流程，减少从学习到实践的切换成本。'
  }
];

export const landingTestimonials: LandingTestimonialItem[] = [
  {
    quote: '以前学生总在不同工具里来回切换。现在我只要在班级里配置好知识库，学生提问能直接对齐课程内容，答疑质量稳定很多。',
    author: '林老师',
    title: '电子信息课程教师',
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg'
  },
  {
    quote: '做电路实验前，我把任务文档丢进去就能得到分析点，再逐条展开，实验准备时间明显缩短。',
    author: '周同学',
    title: '电子工程专业学生',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    quote: '最有价值的是不需要手动选模式，问同一个问题时系统会根据上下文自动给出更合适的处理路径。',
    author: '陈同学',
    title: '班级学习委员',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    quote: '树状对话保留了完整思路链条，回看实验推导过程时非常直观，团队复盘效率高很多。',
    author: '王工',
    title: '硬件研发工程师',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg'
  },
  {
    quote: '课程资源、任务文档和问答记录在同一语境里流转，学生的追问质量比以前高。',
    author: '赵老师',
    title: '课程负责人',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
  },
  {
    quote: '流式输出让我能边看边追问，不用等全部完成再回头改问题，调试电路思路更顺。',
    author: '刘同学',
    title: '电路实验课学生',
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg'
  }
];