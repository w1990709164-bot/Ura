# 平行世界

原文件：`index(5).html`  
标题：`JOINT BASE · OPERATION REMNANT`

## 目录说明

- `index.html`：只保留页面骨架和入口。
- `assets/css/`：从原 `<style>` 拆出的样式。文件名前面的数字代表加载顺序。
- `assets/js/core/`：状态、初始化、导航、设置、存档等核心逻辑。
- `assets/js/systems/`：聊天、地图、任务、面板等游戏功能。
- `assets/js/phone/`：手机/类手机系统相关功能，如果本游戏有。
- `assets/js/api/`：AI/API/提示词调用相关。
- `assets/js/data/`：常量、角色、数据表、剧情配置。

## 修改建议

修 UI 先找 `assets/css/`。  
修存档、设置、初始化找 `assets/js/core/`。  
修剧情、聊天、地图、任务找 `assets/js/systems/`。  
修 AI 接口找 `assets/js/api/`。
