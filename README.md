# Minecraft 数据包可视化生成器

一个纯前端、无需后端的 Minecraft Java版 数据包生成工具。通过可视化界面，让玩家无需手动编写命令和 JSON，就能创建自定义的数据包。

## 功能

- **函数编辑** — 可视化配置函数触发方式（加载/每刻/间隔/事件/血量检测/区域检测/榜单等），通过动作面板添加命令，自动生成 .mcfunction 文件
- **进度系统** — 创建自定义进度/成就，支持物品栏变化、击杀实体、位置检测等多种触发条件
- **战利品表** — 可视化配置掉落，支持自定义掉落物、数量、附魔、药水效果等，可覆盖原版掉落或与原版共存
- **配方** — 支持有序合成、无序合成、熔炼、高炉、烟熏、篝火烹饪、切石、锻造升级等多种配方类型，支持自定义输出物品名称、介绍、附魔
- **原版配方管理** — 可选择禁用原版配方
- **导出** — 一键导出为 ZIP 格式的数据包，可直接放入存档的 datapacks 目录使用
- **注意**：这个网页的数据包是基于1.21.1版本的标准制作的，数据包函数等没有大改的其他版本也能用。

## 使用方法

1. 打开网页
2. 在首页设置数据包名称、描述和命名空间
3. 在对应编辑器中创建函数、进度、战利品表和配方
4. 切换到导出页面，点击"导出为ZIP"
5. 将导出的 ZIP 文件放入你的 Minecraft 存档的 `datapacks` 文件夹中
6. 在游戏内执行 `/reload` 加载数据包

## 在线使用

访问 GitHub Pages 地址即可直接使用，无需安装任何软件。

## 数据来源

- Minecraft 版权归 Mojang 所有，使用请参照 [Minecraft 使用准则](https://www.minecraft.net/usage-games)
- 物品图标使用了中文 Minecraft Wiki 的内容，以 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) 协议授权

## 技术栈

- 纯 HTML + CSS + JavaScript（ES Module）
- [JSZip](https://stuk.github.io/jszip/) — 浏览器端生成 ZIP 文件
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) — 触发文件下载

## 本地运行

直接用浏览器打开 `index.html` 即可，无需任何本地服务器或构建工具。
