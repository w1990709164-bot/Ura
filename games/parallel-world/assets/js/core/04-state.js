// ════════════════════════════════
// STATE
// ════════════════════════════════
let API = { url:'', key:'', model:'gpt-4o' };
let G = {
  playerName:'', realname:'', appearance:'', personality:'', role:'',
  stamina:85, ability:27, mood:72, money:10000,
  day:1, timeIdx:0,
  currentLoc:'公共休息区', currentChar:null,
  chars: JSON.parse(JSON.stringify(CHARS_DATA)),
  dialogueHistory: {}, // per char
  currentBoard: null, currentPost: null,
  activeBounty: null, bounties: [],
  saves: [null,null,null]
};
let isAiLoading = false;
let selRoleVal='', selCharVal='', drawerOpen=false;
