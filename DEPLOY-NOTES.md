# GitHub Pages 部署实战记录（my-docs / shareQuotes）

> 本文记录本项目从「推不上去」到「成功上线」的完整排查过程与可复用命令。
> 适用：VuePress 2 项目、已有 GitHub 仓库、本机开着代理、Windows + Git Bash 环境。

---

## 一、最终结果

| 项 | 值 |
|---|---|
| 线上地址 | https://jiu-hao.github.io/shareQuotes/ |
| 仓库 | https://github.com/jiu-hao/shareQuotes |
| 主分支 | `main`（另有 `gh-pages`） |
| Pages Source | **GitHub Actions**（不是 Deploy from a branch） |
| Workflow | `.github/workflows/deploy.yml`（push main → 构建+发布；PR → 仅构建） |
| 构建输出 | `src/.vuepress/dist` |
| base 路径 | `/shareQuotes/`（见 `src/.vuepress/config.ts:6`） |

---

## 二、部署链路

```
本地改 Markdown
    ↓  git push origin main
GitHub Actions (.github/workflows/deploy.yml)
    ↓  npm ci → npm run docs:build
src/.vuepress/dist
    ↓  actions/upload-pages-artifact
    ↓  actions/deploy-pages
https://jiu-hao.github.io/shareQuotes/
```

**日常只需一条命令**：

```bash
cd "D:/Mine/0813/my-docs"
git add -A && git commit -m "docs: xxx" && git push origin main
```

推送后 1-2 分钟自动上线。

**PR 校验**：向 main 提 PR 时只跑构建、不发线上，用来提前发现「合进去才炸」的问题。
**本地手动部署**：原 `deploy.sh` 与 `npm run deploy:gh-pages` 已废弃删除——线上 Pages Source 是 GitHub Actions，强推 gh-pages 分支不会触发更新。

---

## 三、两个必须配置的前置条件

### 1. git 走代理（否则连不上 github.com）

**症状**：
```
fatal: unable to access 'https://github.com/...': 
Failed to connect to github.com port 443 after 21087 ms: Could not connect to server
```

**根因**：本机有 Clash Verge（`127.0.0.1:7897`），但 **git 是命令行程序，不读系统代理**，所以在直连被墙的 IP 上死等超时。

**排查手段**：

```bash
# ① DNS 是否被污染（正常应返回 GitHub 官方 IP）
nslookup github.com

# ② 扫描本机代理端口
#    Clash 7890/7897 · v2rayN 10809 · 通用 1080/8080
netstat -ano | findstr LISTENING | findstr "7890 7897 10809 1080 8080"

# ③ 走代理测 git 是否通
git -c http.proxy=http://127.0.0.1:7897 ls-remote origin HEAD
```

**修复**（写入 `~/.gitconfig`，**只对 github.com 生效，不影响内网仓库**）：

```ini
[http "https://github.com"]
	proxy = http://127.0.0.1:7897
[https "https://github.com"]
	proxy = http://127.0.0.1:7897
```

验证：`git ls-remote origin HEAD` 无需额外参数即成功。

### 2. 使用 Personal Access Token（GitHub 已废除密码认证）

**症状**：
```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/...'
```

**生成 token**：https://github.com/settings/tokens → Generate new token (**classic**) → 勾选 **`repo`** 权限。

**注意本项目 `~/.gitconfig` 里有一行**：

```ini
[url "https://"]
	insteadOf = ssh://git@
```

它会把**所有 SSH 地址重写成 HTTPS**，所以「改用 SSH 密钥」这条路在当前配置下是走不通的，只能用 HTTPS + token（或删掉这行）。

---

## 四、部署到子路径的必备检查

因为 `base: /shareQuotes/`，所有资源引用必须是 `/shareQuotes/xxx`。部署后务必验证：

```bash
# 首页资源引用是否都带 base 前缀
curl -s https://jiu-hao.github.io/shareQuotes/ | grep -o 'src="[^"]*"'

# 关键路径连通性
for p in / /logo.svg /favicon.ico /sitemap.xml; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' https://jiu-hao.github.io/shareQuotes$p)"
done
```

### 曾修复的两个线上隐患

| 问题 | 原因 | 修复 |
|---|---|---|
| logo 破图 | `theme.ts:14` 声明 `logo: "/logo.svg"`，但 `public/` 根目录无此文件（实际在 `assets/images/`） | 复制一份到 `src/.vuepress/public/logo.svg` |
| 潜在资源被 Jekyll 处理 | Pages 默认跑 Jekyll，会忽略 `_` 开头的文件 | 新增 `src/.vuepress/public/.nojekyll`（空文件即可） |

---

## 五、仓库卫生（已完成的清理）

原仓库把构建产物和依赖都提交了，跟踪文件 **14176 个**：

```
node_modules/           约 13000+ 文件
src/.vuepress/.temp/    217 个
src/.vuepress/dist/     50 个
docs/                   50 个（旧的构建输出目录）
```

清理后 **39 个**（纯源码）。`.gitignore`：

```gitignore
node_modules/
src/.vuepress/dist/
src/.vuepress/.temp/
src/.vuepress/.cache/
src/.vuepress/.vite-cache/
/docs/
*.log
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/extensions.json
.env
.env.local
```

命令（**保留本地文件，只取消跟踪**）：

```bash
git rm -r --cached node_modules docs src/.vuepress/dist src/.vuepress/.temp src/.vuepress/.cache
```

---

## 六、常见故障速查

| 症状 | 原因 | 处理 |
|---|---|---|
| `Failed to connect ... port 443` | 直连被墙，git 没走代理 | 配 `~/.gitconfig` 代理（见三.1） |
| `Password authentication is not supported` | 用了密码而非 token | 生成 PAT，勾 `repo`（见三.2） |
| `Invalid username or token` | 凭据过期或非仓库所有者 | 重新生成 token；确认对该仓库有 write 权限 |
| `remote: Permission denied` / 403 | 对仓库无写权限 | 确认仓库所有者或让 owner 加协作者 |
| Actions 跑绿但站点不更新 | Pages Source 没设为 GitHub Actions | Settings → Pages → Source 选 **GitHub Actions** |
| 页面能开但样式/图片全丢 | `base` 与实际部署路径不匹配 | 检查 `config.ts` 的 `base` 是否等于 `/<仓库名>/` |
| `npm ci` 失败 | `package-lock.json` 与 `package.json` 不一致 | 本地跑 `npm install` 更新 lock 后提交 |
| 打开是 404 | 首次部署需 1-2 分钟；或 base 写错 | 稍等后重试；核对 base |

---

## 七、该技能包的适用边界（重要）

`web-deploy-github` 技能（marketplace 安装）**只适用于从零创建纯静态单页站**：

- 它的 `init_project.sh` 生成 HTML/CSS/JS 三件套
- 它的 `deploy_github_pages.sh` 会 `gh repo create` 新建仓库，并强推 `gh-pages` 分支
- 它假设 Pages Source 是 `gh-pages` 分支，**而非 GitHub Actions**

**对已有框架项目（VuePress / Vite / Next 等）不适用**，且它依赖 `gh` CLI 与 `bash` 脚本，本机 `gh` 未安装、Bash 工具链 PATH 残缺，实际跑不起来。遇到框架项目直接照本文流程手动操作。

---

## 八、环境坑位备忘（本机 Windows）

- **Bash 工具 PATH 严重残缺**：`ls` / `head` / `grep` / `sed` / `wc` / `dirname` / `rm` / `npm` / `gh` 全不可用；`cmd //c "..."` 会掉进交互模式
- **可行替代**：用 `node -e` 或临时 `.js` 脚本执行文件与命令操作
  - node：`C:/Users/Mayn/.workbuddy/binaries/node/versions/22.22.2-3/node.exe`
  - npm：同目录 `npm.cmd`
- `git rm -r --cached` 处理上万文件时需要较高的 `maxBuffer`
- `api.github.com` 匿名请求会限流，查 Actions 日志需带 token
