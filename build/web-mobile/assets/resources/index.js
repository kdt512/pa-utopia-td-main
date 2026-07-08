System.register("chunks:///_virtual/en.ts",["cc"],(function(t){var e;return{setters:[function(t){e=t.cclegacy}],execute:function(){e._RF.push({},"65a5ew8vA1HjZx7VeBpZJbi","en",void 0);var a=window,s=t("languages",{attack_upgrade:"Attack Upgrade",tap_to_upgrade:"Tap to upgrade!",upgrade:"Upgrade",stats_type_0:"Damage",stats_type_1:"Attack Range",stats_type_2:"Attack Speed",stats_type_3:"Health",stats_type_4:"Speed"});a.languages||(a.languages={}),a.languages.en=s,e._RF.pop()}}}));

System.register("chunks:///_virtual/jp.ts",["cc"],(function(a){var e;return{setters:[function(a){e=a.cclegacy}],execute:function(){e._RF.push({},"b8a7a9DbL1CEoVQ+aFbkYh7","jp",void 0);var t=window,u=a("languages",{attack_upgrade:"攻撃アップグレード",tap_to_upgrade:"タップしてアップグレード！",upgrade:"アップグレード"});t.languages||(t.languages={}),t.languages.jp=u,e._RF.pop()}}}));

System.register("chunks:///_virtual/kr.ts",["cc"],(function(a){var e;return{setters:[function(a){e=a.cclegacy}],execute:function(){e._RF.push({},"cb19eLVEv5PaoRCMZwNPTOf","kr",void 0);var t=window,u=a("languages",{attack_upgrade:"공격 업그레이드",tap_to_upgrade:"업그레이드하려면 탭하세요!",upgrade:"업그레이드"});t.languages||(t.languages={}),t.languages.kr=u,e._RF.pop()}}}));

System.register("chunks:///_virtual/resources",["./en.ts","./jp.ts","./kr.ts","./tw.ts"],(function(){return{setters:[null,null,null,null],execute:function(){}}}));

System.register("chunks:///_virtual/tw.ts",["cc"],(function(a){var e;return{setters:[function(a){e=a.cclegacy}],execute:function(){e._RF.push({},"d4de7G3LIJIP6YRW7m0lh+p","tw",void 0);var t=window,u=a("languages",{attack_upgrade:"攻擊升級",tap_to_upgrade:"點擊升級！",upgrade:"升級"});t.languages||(t.languages={}),t.languages.tw=u,e._RF.pop()}}}));

(function(r) {
  r('virtual:///prerequisite-imports/resources', 'chunks:///_virtual/resources'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});