#!/usr/bin/env sh

# 注意：正式部署走 GitHub Actions（.github/workflows/deploy.yml），
# 推送到 main 分支即自动构建并发布，无需手动运行本脚本。
# 本脚本仅作为「本地手动兜底」使用。

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run docs:build

# 进入生成的文件夹
cd src/.vuepress/dist

# 如果是发布到自定义域名
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# 如果发布到 https://<USERNAME>.github.io
# git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git master

# 如果发布到 https://<USERNAME>.github.io/<REPO>
# 注意：这里是 git 仓库地址，不是站点地址
git push -f git@github.com:jiu-hao/shareQuotes.git main:gh-pages

cd -

