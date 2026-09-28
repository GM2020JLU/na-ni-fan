# Mac 固定地址运行说明

分享地址：https://fan.goumin.work

网页运行在 `ssh mac` 对应的 GM-MAC 上。固定域名通过专用 Cloudflare 命名隧道连接 Mac，仅转发网站的回环地址 `http://127.0.0.1:4177`。没有改动已有的 goumin-work / studio 服务。

## 服务与路径

- 运行目录：`/Users/goumin/.local/share/na-ni-fan/`
- 当前版本：`current` 符号链接，本次发布版本 `releases/20260928-152103`。
- 网页：`com.goumin.na-ni-fan.web`，由 `caffeinate -i` 包装 Node 服务。
- 隧道：`com.goumin.na-ni-fan.tunnel`。
- 两个 LaunchAgent 位于 `/Users/goumin/Library/LaunchAgents/`，均设置 `RunAtLoad` 和 `KeepAlive`。
- 日志：运行目录的 `logs/`。
- 隧道配置 `cloudflared.yml`、凭据 `tunnel.json` 仅保存在 Mac，凭据文件权限为 600。不要将凭据打包到网站或对外发送。

这两个服务在用户登录后自动启动；它们不是开机登录前启动的系统服务。Mac 必须保持供电和网络，关机、手动睡眠或断网时网页不可访问。没有进行整机重启或长期在线测试。

## 查看与重启

在 Mac 终端中执行：

```sh
launchctl print gui/$(id -u)/com.goumin.na-ni-fan.web
launchctl print gui/$(id -u)/com.goumin.na-ni-fan.tunnel
curl -f http://127.0.0.1:4177/
launchctl kickstart -k gui/$(id -u)/com.goumin.na-ni-fan.web
```

## 更新和回退

Linux 源码在 `/home/goumin/Workspace/na-ni-fan/`。发布时，将当前 `dist/`、`scripts/serve.mjs` 和 `package.json` 同步到 Mac 的一个新 `releases/<时间戳>/` 目录；不发布文档、旧素材、测试或任何凭据。

1. 对发布文件生成 SHA256 清单，上传后逐项校验。
2. 将 `current` 原子切换至新版本。
3. 重启 `com.goumin.na-ni-fan.web`，使 Node 从新目录加载文件。
4. 检查 Mac 回环地址和固定公网地址的首页、脚本、图片和样式。

如需回退，将 `current` 指向保留的旧版本，再重启网页服务。域名和隧道不需要变动。历史版本 `20260928-145346` 还包含工作／考试篇且没有配乐，仅供恢复参考。

## 停止或恢复分享

仅停止公网入口，保留本机网站：

```sh
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.goumin.na-ni-fan.tunnel.plist
```

恢复：

```sh
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.goumin.na-ni-fan.tunnel.plist
```

`bootout` 停止本次登录会话的服务；保留 plist 时，下次登录仍会启动。需要永久禁用时再通过 `launchctl disable` 管理，不要只杀进程，因为 `KeepAlive` 会自动拉起。
