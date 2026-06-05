# 里世界 · 模块化游戏合集

## 入口

上传到 GitHub 后，Cloudflare Pages 的根目录指向本项目根目录即可。

- `index.html`：里世界总入口。
- `games/`：每个游戏一个独立目录。
- `shared/`：以后要共用的 API、存档、UI 工具可以放这里。
- `manifest.json`：当前合集内游戏清单。

## 每个游戏的结构

```text
games/游戏名/
├─ index.html
└─ assets/
   ├─ css/
   │  ├─ 01-base-xxx.css
   │  ├─ 02-screens-xxx.css
   │  └─ ...
   └─ js/
      ├─ core/
      ├─ systems/
      ├─ phone/
      ├─ api/
      └─ data/
```

## 后续怎么改

- 改视觉：找 `assets/css/`。
- 改开局、设置、存档：找 `assets/js/core/`。
- 改聊天、地图、任务、角色互动：找 `assets/js/systems/`。
- 改手机/通讯/论坛/钱包类功能：找 `assets/js/phone/`。
- 改 AI 接口、模型、提示词：找 `assets/js/api/`。
- 改角色、道具、地点等静态配置：找 `assets/js/data/`。

## 注意

本次拆分尽量保持原逻辑不变，只改变文件组织方式。文件名前的数字代表加载顺序，不建议随便改顺序。
