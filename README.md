# 那你烦什么 · 奶龙歪理小剧场

一个由奶龙一本正经地主持的互动笑话页面：问题沿着选择递进，最后由包袱收住。

在线演示：[fan.goumin.work](https://fan.goumin.work)

项目原创代码以 [MIT 许可证](LICENSE) 开源。奶龙形象及第三方素材不在该许可证授权范围内，详见 [素材说明](docs/assets.md)。

## 有什么

- 两段经典互动笑话：人生篇与“这件事，你能解决吗？”
- 奶龙卡通动效、答题反馈、改答、返回和重来。
- 原创浏览器本地合成配乐默认开启；受浏览器自动播放限制时，会在首次点击、触摸或键盘操作后开始。页头按钮可随时关闭。
- 响应式界面，适配窄屏浏览。
- 可导出为单个离线 HTML 文件。
- 纯静态实现，无第三方运行时依赖、账号、统计或外部 AI 请求。

## 快速开始

需要 Node.js 20 或更新版本。

```bash
git clone https://github.com/GM2020JLU/na-ni-fan.git
cd na-ni-fan
npm start
```

打开终端输出的本地地址即可体验。源码直接位于 `dist/`，修改后刷新浏览器即可查看。

## 怎么玩

- 首页从人生篇开始：健康／生病 → 康复／死亡 → 天堂／地狱；好结果立即收住，最坏结果转成和老朋友握手。
- 点击右上角「换个问法」，或任一结尾的次要按钮，直接切到另一段经典笑话。
- 「不服，换个答案」回到最近的问题；「上一句」「从头再来」「先到这里」分别处理会话进度。

## 项目结构

- `dist/lib/classics.mjs`：两段经典笑话内容。
- `dist/lib/conversations.mjs`：内容注册和默认入口。
- `dist/lib/engine.mjs`：会话状态、返回、改答和剧情图检查。
- `dist/lib/music.mjs`：原创本地合成配乐。
- `dist/app.mjs`：舞台、剧情切换、配乐和动效控制。
- `dist/style.css`：响应式布局与奶龙互动动效。
- `dist/assets/nailoong.png`：奶龙角色图；来源与素材说明见 [docs/assets.md](docs/assets.md)。

## 验证与离线导出

```bash
npm test
npm run check
npm run export:offline
```

`export:offline` 会将当前界面、剧情、样式、配乐代码和角色图片打包为一个 HTML 文件。也可以指定输出位置：

```bash
npm run export:offline -- /绝对路径/那你烦什么-奶龙版.html
```

将生成的文件交给现代浏览器打开即可离线使用；聊天软件内置附件预览未必会执行网页脚本。

## 部署

在线演示运行在个人 Mac 的静态站点服务上。部署、更新和回退细节见 [docs/mac-hosting.md](docs/mac-hosting.md)。
