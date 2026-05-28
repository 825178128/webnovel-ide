import type { AIRequest, Character, Chapter, Project, Setting, Volume, WebnovelIDEState } from '../../types'
import { countWords, createId, nowIso } from '../../utils'
import { touchState } from '../repositories/stateHelpers'

const DEMO_PROJECT_TITLE = '示例：雾港巡夜人'

export function ensureDemoProject(state: WebnovelIDEState): { state: WebnovelIDEState; projectId: string; firstChapterId: string } {
  const existing = state.projects.find((project) => project.title === DEMO_PROJECT_TITLE)
  if (existing) {
    const firstChapterId = state.chapters.find((chapter) => chapter.projectId === existing.id)?.id ?? ''
    return {
      state: touchState(state),
      projectId: existing.id,
      firstChapterId,
    }
  }

  const timestamp = nowIso()
  const projectId = createId('project')
  const volumeOneId = createId('volume')
  const volumeTwoId = createId('volume')
  const chapterOneId = createId('chapter')
  const chapterTwoId = createId('chapter')
  const chapterThreeId = createId('chapter')
  const chapterFourId = createId('chapter')
  const chapterFiveId = createId('chapter')
  const linYanId = createId('character')
  const xiaQingId = createId('character')
  const yanMingId = createId('character')
  const wuGangId = createId('setting')
  const nightBellId = createId('setting')
  const patrolRuleId = createId('setting')
  const mirrorId = createId('setting')

  const project: Project = {
    id: projectId,
    userId: 'user_local',
    title: DEMO_PROJECT_TITLE,
    genre: '悬疑升级 / 都市异能',
    synopsis:
      '退役巡夜人林砚回到常年起雾的港城，发现失踪三年的妹妹留下了夜钟会的暗号。他必须在每晚零点后的雾区巡查中找回真相，同时避免自己被城市记录为“已死亡人员”。',
    targetPlatform: '番茄 / 七猫',
    targetWordCount: 1200000,
    dailyWordTarget: 4000,
    status: 'writing',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const volumes: Volume[] = [
    {
      id: volumeOneId,
      projectId,
      title: '第一卷 雾港归人',
      summary: '林砚回到雾港，重新接触巡夜人体系，并发现妹妹失踪与夜钟会有关。',
      order: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: volumeTwoId,
      projectId,
      title: '第二卷 夜钟回响',
      summary: '夜钟会浮出水面，林砚开始追查城市档案中的死亡名单。',
      order: 2,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  const chapterDrafts = [
    {
      id: chapterOneId,
      volumeId: volumeOneId,
      title: '第 1 章 雾港来信',
      goal: '主角回城，收到妹妹留下的暗号，结尾出现第一处异常。',
      summary: '林砚收到三年前失踪妹妹的旧信，回到雾港后发现码头钟楼在无人敲钟时响了十三下。',
      status: 'completed' as const,
      order: 1,
      content:
        '林砚下车时，雾已经漫过站台黄线。\n\n雾港的雾从不讲道理，像一层潮湿的旧布，盖住路灯、车牌和人的表情。他把妹妹寄来的信攥在掌心，信纸边缘被汗浸软，最后一行字却仍然清楚：午夜以后，不要相信钟声。\n\n码头方向忽然传来钟响。\n\n一下，两下，直到第十三下。\n\n林砚抬头，看见废弃钟楼顶端，有人影正背对着他，举起一盏蓝色的巡夜灯。',
    },
    {
      id: chapterTwoId,
      volumeId: volumeOneId,
      title: '第 2 章 蓝灯巡夜',
      goal: '解释巡夜人基础规则，让夏青登场，并抛出“死亡档案”。',
      summary: '夏青带林砚进入巡夜署，提醒他名字已经出现在死亡档案里。',
      status: 'writing' as const,
      order: 2,
      content:
        '巡夜署藏在旧海关大楼背面，门口没有招牌，只有一盏永远不灭的蓝灯。\n\n夏青把伞收起，水珠顺着伞骨落了一地。她看了林砚一眼，说：“你不该回来。”\n\n“我妹妹还活着。”\n\n“在雾港，活着不是一个稳定状态。”夏青推开档案室的门，铁柜自动滑出，最上层的档案袋写着林砚的名字。\n\n袋口封条鲜红，登记状态：已死亡。',
    },
    {
      id: chapterThreeId,
      volumeId: volumeOneId,
      title: '第 3 章 死亡档案',
      goal: '主角第一次违反巡夜规则，获得线索也付出代价。',
      summary: '林砚翻开自己的死亡档案，看见未来七天后的死亡记录。',
      status: 'draft' as const,
      order: 3,
      content:
        '档案袋里只有一张照片。\n\n照片上的林砚站在钟楼下，胸口插着一枚生锈的铜钥匙。照片背面写着日期，正好是七天后。\n\n夏青想抢走照片，林砚却先一步看见照片角落里的倒影：妹妹林雾站在他身后，嘴型像是在说两个字。\n\n别听。',
    },
    {
      id: chapterFourId,
      volumeId: volumeTwoId,
      title: '第 4 章 夜钟会',
      goal: '引入反派组织夜钟会，明确第一卷追查方向。',
      summary: '',
      status: 'draft' as const,
      order: 1,
      content:
        '雾港没有人公开谈论夜钟会。\n\n但每个老巡夜人都知道，如果午夜之后听见第十三声钟响，就说明有人在城市档案里改掉了一个活人的结局。',
    },
    {
      id: chapterFiveId,
      volumeId: volumeTwoId,
      title: '第 5 章 镜面码头',
      goal: '让主角进入第一个高危场景，发现妹妹线索。',
      summary: '',
      status: 'draft' as const,
      order: 2,
      content:
        '镜面码头在退潮后才会出现。\n\n林砚踩上湿滑的黑石板，看见脚下倒映出的不是自己，而是三年前那个还没有失踪的妹妹。',
    },
  ]

  const chapters: Chapter[] = chapterDrafts.map((chapter) => ({
    ...chapter,
    projectId,
    wordCount: countWords(chapter.content),
    createdAt: timestamp,
    updatedAt: timestamp,
  }))

  const characters: Character[] = [
    {
      id: linYanId,
      projectId,
      name: '林砚',
      role: '退役巡夜人 / 主角',
      faction: '巡夜署',
      personality: '冷静、克制、对妹妹线索异常执着',
      desire: '找回妹妹林雾，并弄清自己的死亡档案来源',
      abilities: '能短暂看见雾中残留的死亡记录',
      speechStyle: '短句多，压住情绪，不轻易解释',
      currentState: '刚回到雾港，已被档案系统登记为七天后死亡',
      notes: '他的退役原因暂不揭露，作为第一卷中段反转。',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: xiaQingId,
      projectId,
      name: '夏青',
      role: '巡夜署档案员',
      faction: '巡夜署',
      personality: '谨慎、嘴硬、规则感强',
      desire: '阻止林砚破坏巡夜规则，同时暗中帮他查妹妹线索',
      abilities: '熟悉死亡档案和雾区路线',
      speechStyle: '提醒式发言，经常用规则压人',
      currentState: '知道林砚妹妹失踪的部分真相，但暂时隐瞒',
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: yanMingId,
      projectId,
      name: '严明',
      role: '巡夜署署长',
      faction: '巡夜署',
      personality: '温和、老派、擅长隐藏关键信息',
      desire: '维持雾港秩序，避免夜钟会引发城市级灾难',
      abilities: '掌握多年前夜钟会清剿档案',
      speechStyle: '慢条斯理，喜欢用旧案做比喻',
      currentState: '默许林砚回归，但没有恢复他的巡夜人身份',
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  const settings: Setting[] = [
    {
      id: wuGangId,
      projectId,
      title: '雾港',
      category: 'location',
      content: '常年被异常海雾包围的港城。午夜后部分街区会进入雾区，普通人记忆会被改写。',
      importance: 'high',
      notes: '城市本身要像角色一样有压迫感。',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: nightBellId,
      projectId,
      title: '夜钟会',
      category: 'faction',
      content: '隐藏组织，疑似能通过钟声修改死亡档案。每次第十三声钟响后，会有人从城市记录中被抹除。',
      importance: 'high',
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: patrolRuleId,
      projectId,
      title: '巡夜规则',
      category: 'rule',
      content: '巡夜人午夜后可进入雾区，但不得回应身后第三次呼唤，不得相信无人敲响的钟声。',
      importance: 'high',
      notes: '规则要服务悬念和危机，而不是纯设定展示。',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: mirrorId,
      projectId,
      title: '镜面码头',
      category: 'location',
      content: '退潮后出现的异常码头，水面会映出三年前的影像，是寻找林雾的重要地点。',
      importance: 'medium',
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  const aiRequests: AIRequest[] = [
    {
      id: createId('ai'),
      userId: 'user_local',
      projectId,
      chapterId: chapterTwoId,
      taskType: 'summarize',
      instruction: '提炼本章关键信息，供后续章节使用',
      inputSnapshot: JSON.stringify({
        project: project.title,
        chapter: '第 2 章 蓝灯巡夜',
        relatedCharacters: ['林砚', '夏青'],
        relatedSettings: ['巡夜规则', '雾港'],
      }),
      output: '林砚回到巡夜署，夏青告知他已被登记为死亡人员，死亡档案成为后续主线线索。',
      provider: 'mock',
      model: 'local-prototype',
      status: 'succeeded',
      createdAt: timestamp,
      completedAt: timestamp,
    },
  ]

  return {
    state: touchState({
      ...state,
      projects: [...state.projects, project],
      volumes: [...state.volumes, ...volumes],
      chapters: [...state.chapters, ...chapters],
      characters: [...state.characters, ...characters],
      settings: [...state.settings, ...settings],
      chapterCharacters: [
        ...state.chapterCharacters,
        { chapterId: chapterOneId, characterId: linYanId, createdAt: timestamp },
        { chapterId: chapterTwoId, characterId: linYanId, createdAt: timestamp },
        { chapterId: chapterTwoId, characterId: xiaQingId, createdAt: timestamp },
        { chapterId: chapterThreeId, characterId: linYanId, createdAt: timestamp },
        { chapterId: chapterThreeId, characterId: xiaQingId, createdAt: timestamp },
        { chapterId: chapterFourId, characterId: yanMingId, createdAt: timestamp },
      ],
      chapterSettings: [
        ...state.chapterSettings,
        { chapterId: chapterOneId, settingId: wuGangId, createdAt: timestamp },
        { chapterId: chapterOneId, settingId: nightBellId, createdAt: timestamp },
        { chapterId: chapterTwoId, settingId: patrolRuleId, createdAt: timestamp },
        { chapterId: chapterTwoId, settingId: wuGangId, createdAt: timestamp },
        { chapterId: chapterThreeId, settingId: patrolRuleId, createdAt: timestamp },
        { chapterId: chapterFourId, settingId: nightBellId, createdAt: timestamp },
        { chapterId: chapterFiveId, settingId: mirrorId, createdAt: timestamp },
      ],
      aiRequests: [...state.aiRequests, ...aiRequests],
    }),
    projectId,
    firstChapterId: chapterOneId,
  }
}
