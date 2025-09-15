/**
 * 摸鱼功能组件统一入口
 * 
 * 提供完整的摸鱼功能支持，包括：
 * - 界面伪装和透明度控制
 * - 快捷键和老板键支持
 * - 窗口管理和系统托盘
 * - 自动检测和智能隐藏
 */

import StealthSettings from './StealthSettings.vue'

// 导出组件
export {
  StealthSettings
}

// 默认导出
export default {
  StealthSettings
}

/**
 * 组件使用说明
 * 
 * 1. StealthSettings - 摸鱼模式设置组件
 *    功能：
 *    - 基础设置：启用/禁用、透明度、窗口置顶
 *    - 快捷键设置：切换摸鱼、老板键、隐藏窗口
 *    - 界面伪装：代码编辑器、Excel、Word等多种伪装模式
 *    - 高级设置：鼠标穿透、自动隐藏、系统托盘
 *    - 预设方案：办公室、居家、隐身、自定义模式
 * 
 *    使用示例：
 *    ```vue
 *    <template>
 *      <StealthSettings 
 *        @stealth-toggle="handleStealthToggle"
 *        @settings-change="handleSettingsChange"
 *        @boss-key-pressed="handleBossKey"
 *      />
 *    </template>
 *    
 *    <script>
 *    import { StealthSettings } from '@/modules/novel/components/stealth'
 *    
 *    export default {
 *      components: {
 *        StealthSettings
 *      },
 *      methods: {
 *        handleStealthToggle(enabled) {
 *          console.log('摸鱼模式:', enabled)
 *        },
 *        handleSettingsChange(settings) {
 *          console.log('设置变更:', settings)
 *        },
 *        handleBossKey() {
 *          console.log('老板键触发')
 *        }
 *      }
 *    }
 *    </script>
 *    ```
 */

/**
 * 摸鱼功能特性
 * 
 * 1. 界面伪装
 *    - 代码编辑器：伪装成VS Code等开发环境
 *    - Excel表格：显示工作相关的表格数据
 *    - Word文档：显示工作报告或文档内容
 *    - 邮件客户端：显示邮件界面
 *    - 浏览器：显示工作相关网页
 *    - 终端命令行：显示技术操作界面
 * 
 * 2. 快捷键支持
 *    - 切换摸鱼模式：快速开启/关闭摸鱼功能
 *    - 老板键：瞬间切换到伪装界面
 *    - 隐藏窗口：快速隐藏整个应用
 *    - 自定义快捷键：支持Ctrl、Alt、Shift组合
 * 
 * 3. 智能检测
 *    - 窗口检测：检测特定应用窗口自动启用伪装
 *    - 自动隐藏：无操作时自动隐藏界面
 *    - 鼠标穿透：允许点击穿透到下层窗口
 * 
 * 4. 窗口管理
 *    - 透明度控制：10%-100%透明度调节
 *    - 窗口置顶：保持在最前面显示
 *    - 系统托盘：最小化到托盘而非任务栏
 * 
 * 5. 预设方案
 *    - 办公室模式：适合严格的办公环境
 *    - 居家模式：适合在家办公场景
 *    - 隐身模式：最大程度的隐蔽性
 *    - 自定义模式：根据个人需求调整
 */

/**
 * 技术实现说明
 * 
 * 1. Electron集成
 *    - 使用Electron API控制窗口属性
 *    - 全局快捷键注册和监听
 *    - 系统托盘和通知支持
 * 
 * 2. 伪装实现
 *    - CSS样式动态切换
 *    - 内容模板系统
 *    - 实时界面替换
 * 
 * 3. 性能优化
 *    - 懒加载伪装内容
 *    - 事件防抖处理
 *    - 内存占用控制
 * 
 * 4. 安全考虑
 *    - 快捷键冲突检测
 *    - 权限最小化原则
 *    - 数据本地存储
 */

/**
 * 配置选项
 * 
 * ```javascript
 * const stealthConfig = {
 *   // 基础设置
 *   enabled: false,              // 是否启用摸鱼模式
 *   opacity: 0.9,               // 窗口透明度 (0.1-1.0)
 *   alwaysOnTop: false,         // 窗口置顶
 *   
 *   // 快捷键设置
 *   hotkeys: {
 *     toggle: 'Ctrl+Shift+H',   // 切换摸鱼模式
 *     boss: 'Ctrl+Shift+B',     // 老板键
 *     hide: 'Ctrl+Shift+X'      // 隐藏窗口
 *   },
 *   
 *   // 伪装设置
 *   disguiseMode: 'none',       // 伪装模式
 *   disguiseContent: '',        // 伪装内容
 *   autoDisguise: false,        // 自动伪装
 *   triggerWindows: [],         // 触发窗口列表
 *   
 *   // 高级设置
 *   mouseThrough: false,        // 鼠标穿透
 *   autoHideDelay: 30,          // 自动隐藏延迟(秒)
 *   startWithStealth: false,    // 启动时启用
 *   systemTray: true            // 系统托盘
 * }
 * ```
 */

/**
 * 事件说明
 * 
 * 1. stealth-toggle
 *    - 触发时机：摸鱼模式开启/关闭时
 *    - 参数：enabled (boolean) - 是否启用
 * 
 * 2. settings-change
 *    - 触发时机：任何设置项变更时
 *    - 参数：settings (object) - 完整设置对象
 * 
 * 3. boss-key-pressed
 *    - 触发时机：老板键被按下时
 *    - 参数：无
 * 
 * 4. window-hide
 *    - 触发时机：窗口隐藏快捷键触发时
 *    - 参数：无
 * 
 * 5. disguise-activate
 *    - 触发时机：伪装模式激活时
 *    - 参数：mode (string) - 伪装模式类型
 */

/**
 * 扩展性说明
 * 
 * 1. 新增伪装模式
 *    - 在disguiseMode选项中添加新类型
 *    - 实现对应的伪装内容模板
 *    - 添加相应的CSS样式
 * 
 * 2. 自定义快捷键
 *    - 支持任意键盘组合
 *    - 自动冲突检测
 *    - 动态注册和注销
 * 
 * 3. 插件系统
 *    - 支持第三方伪装插件
 *    - 可扩展的检测规则
 *    - 自定义触发条件
 * 
 * 4. 主题支持
 *    - 多套伪装主题
 *    - 动态主题切换
 *    - 自定义样式覆盖
 */

/**
 * 使用建议
 * 
 * 1. 合理设置透明度
 *    - 办公环境建议80%以下
 *    - 居家环境可适当提高
 *    - 避免过低影响使用体验
 * 
 * 2. 快捷键选择
 *    - 避免与系统快捷键冲突
 *    - 选择容易记忆的组合
 *    - 考虑键盘布局差异
 * 
 * 3. 伪装内容
 *    - 选择符合工作环境的内容
 *    - 定期更新伪装素材
 *    - 避免过于明显的特征
 * 
 * 4. 性能考虑
 *    - 避免频繁切换模式
 *    - 合理设置自动隐藏时间
 *    - 监控内存和CPU使用
 */