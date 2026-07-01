/* ============================================================
   32-audio-pronunciation.js
   Ajout audio des noms chinois ACU/PHARMA.
   Cherche les mp3 dans le dossier: audio/
   Ne joue que les fichiers avec correspondance hanzi exacte.
   Les fichiers ambigus multi-noms sont volontairement ignorés.
   ============================================================ */
(function(){
  "use strict";

  const AUDIO_BASE_PATH = "audio/";
  const AUDIO_BY_HANZI = {
  "三七": "三七_baidu_zh.mp3",
  "三商": "三商_google_zh-CN.mp3",
  "三棱": "三棱_baidu_zh.mp3",
  "三焦俞": "三焦俞_baidu_zh.mp3",
  "三角灸": "三角灸_baidu_zh.mp3",
  "三间": "三间_baidu_zh.mp3",
  "三阴交": "三阴交_baidu_zh.mp3",
  "上巨虚": "上巨虚_baidu_zh.mp3",
  "上廉": "上廉_baidu_zh.mp3",
  "上脘": "上脘_baidu_zh.mp3",
  "下关": "下关_baidu_zh.mp3",
  "下巨虚": "下巨虚_baidu_zh.mp3",
  "丘墟": "丘墟_baidu_zh.mp3",
  "中封": "中封_baidu_zh.mp3",
  "中府": "中府_baidu_zh.mp3",
  "中极": "中极_baidu_zh.mp3",
  "中泉": "中泉_google_zh-CN.mp3",
  "中脘": "中脘_baidu_zh.mp3",
  "中都": "中都_baidu_zh.mp3",
  "中魁": "中魁_google_zh-CN.mp3",
  "丰隆": "丰隆_baidu_zh.mp3",
  "丹参": "丹参_baidu_zh.mp3",
  "乳根": "乳根_baidu_zh.mp3",
  "乳香": "乳香_baidu_zh.mp3",
  "二间": "二间_baidu_zh.mp3",
  "云门": "云门_baidu_zh.mp3",
  "五味子": "五味子_baidu_zh.mp3",
  "交信": "交信_baidu_zh.mp3",
  "京门": "京门_baidu_zh.mp3",
  "京骨": "京骨_baidu_zh.mp3",
  "人中": "人中_baidu_zh.mp3",
  "人参": "人参_baidu_zh.mp3",
  "仆参": "仆参_baidu_zh.mp3",
  "仙鹤草": "仙鹤草_baidu_zh.mp3",
  "会宗": "会宗_baidu_zh.mp3",
  "会阴": "会阴_baidu_zh.mp3",
  "侠溪": "侠溪_baidu_zh.mp3",
  "侠白": "侠白_baidu_zh.mp3",
  "侧柏叶": "侧柏叶_baidu_zh.mp3",
  "偏历": "偏历_baidu_zh.mp3",
  "光明": "光明_baidu_zh.mp3",
  "党参": "党参_baidu_zh.mp3",
  "全蝎": "全蝎_baidu_zh.mp3",
  "八邪": "八邪_google_zh-CN.mp3",
  "公孙": "公孙_baidu_zh.mp3",
  "关元": "关元_baidu_zh.mp3",
  "养老": "养老_baidu_zh.mp3",
  "内关": "内关_baidu_zh.mp3",
  "内庭": "内庭_baidu_zh.mp3",
  "内踝尖": "内踝尖_baidu_zh.mp3",
  "冲阳": "冲阳_baidu_zh.mp3",
  "决明子": "决明子_baidu_zh.mp3",
  "凤眼": "凤眼_google_zh-CN.mp3",
  "分": "分_google_zh-CN.mp3",
  "列缺": "列缺_baidu_zh.mp3",
  "劳宫": "劳宫_baidu_zh.mp3",
  "北沙参": "北沙参_baidu_zh.mp3",
  "十宣": "十宣_google_zh-CN.mp3",
  "半夏": "半夏_baidu_zh.mp3",
  "印堂": "印堂_google_zh-CN.mp3",
  "厉兑": "厉兑_baidu_zh.mp3",
  "厚朴": "厚朴_baidu_zh.mp3",
  "厥阴俞": "厥阴俞_baidu_zh.mp3",
  "合谷": "合谷_baidu_zh.mp3",
  "后溪": "后溪_baidu_zh.mp3",
  "听会": "听会_google_zh-CN.mp3",
  "听宫": "听宫_google_zh-CN.mp3",
  "命门": "命门_baidu_zh.mp3",
  "哑门": "哑门_baidu_zh.mp3",
  "商丘": "商丘_baidu_zh.mp3",
  "商阳": "商阳_baidu_zh.mp3",
  "四白": "四白_baidu_zh.mp3",
  "四神聪": "四神聪_google_zh-CN.mp3",
  "四缝": "四缝_google_zh-CN.mp3",
  "地五会": "地五会_baidu_zh.mp3",
  "地仓": "地仓_baidu_zh.mp3",
  "地机": "地机_baidu_zh.mp3",
  "地榆": "地榆_baidu_zh.mp3",
  "地神": "地神_google_zh-CN.mp3",
  "地骨皮": "地骨皮_baidu_zh.mp3",
  "复溜": "复溜_baidu_zh.mp3",
  "夏枯草": "夏枯草_baidu_zh.mp3",
  "外丘": "外丘_baidu_zh.mp3",
  "外关": "外关_baidu_zh.mp3",
  "外劳宫": "外劳宫_google_zh-CN.mp3",
  "外踝尖": "外踝尖_baidu_zh.mp3",
  "大包": "大包_baidu_zh.mp3",
  "大拇指头": "大拇指头_google_zh-CN.mp3",
  "大指节横纹": "大指节横纹_google_zh-CN.mp3",
  "大敦": "大敦_baidu_zh.mp3",
  "大杼": "大杼_baidu_zh.mp3",
  "大枣": "大枣_baidu_zh.mp3",
  "大椎": "大椎_baidu_zh.mp3",
  "大横": "大横_baidu_zh.mp3",
  "大肠俞": "大肠俞_baidu_zh.mp3",
  "大都": "大都_baidu_zh.mp3",
  "大钟": "大钟_baidu_zh.mp3",
  "大陵": "大陵_baidu_zh.mp3",
  "大骨空": "大骨空_google_zh-CN.mp3",
  "大黄": "大黄_baidu_zh.mp3",
  "天井": "天井_baidu_zh.mp3",
  "天南星": "天南星_baidu_zh.mp3",
  "天府": "天府_baidu_zh.mp3",
  "天枢": "天枢_baidu_zh.mp3",
  "天柱": "天柱_google_zh-CN.mp3",
  "天池": "天池_baidu_zh.mp3",
  "天突": "天突_baidu_zh.mp3",
  "天窗穴": "天窗穴_baidu_zh.mp3",
  "天竺黄": "天竺黄_baidu_zh.mp3",
  "天花粉": "天花粉_baidu_zh.mp3",
  "天髎": "天髎_baidu_zh.mp3",
  "天麻": "天麻_baidu_zh.mp3",
  "太乙": "太乙_baidu_zh.mp3",
  "太冲": "太冲_baidu_zh.mp3",
  "太渊": "太渊_baidu_zh.mp3",
  "太溪": "太溪_baidu_zh.mp3",
  "太白": "太白_baidu_zh.mp3",
  "太阳": "太阳_baidu_zh.mp3",
  "头维": "头维_google_zh-CN.mp3",
  "委中": "委中_baidu_zh.mp3",
  "姜黄": "姜黄_baidu_zh.mp3",
  "孔最": "孔最_baidu_zh.mp3",
  "安眠": "安眠_google_zh-CN.mp3",
  "射干": "射干_baidu_zh.mp3",
  "小海": "小海_baidu_zh.mp3",
  "小肠俞": "小肠俞_baidu_zh.mp3",
  "小蓟": "小蓟_baidu_zh.mp3",
  "小骨空": "小骨空_google_zh-CN.mp3",
  "少冲": "少冲_baidu_zh.mp3",
  "少商": "少商_baidu_zh.mp3",
  "少府": "少府_baidu_zh.mp3",
  "少泽": "少泽_baidu_zh.mp3",
  "尺泽": "尺泽_baidu_zh.mp3",
  "川芎": "川芎_baidu_zh.mp3",
  "川贝母": "川贝母_baidu_zh.mp3",
  "巨阙": "巨阙_baidu_zh.mp3",
  "巨骨": "巨骨_baidu_zh.mp3",
  "巨髎": "巨髎_baidu_zh.mp3",
  "带脉": "带脉_baidu_zh.mp3",
  "干姜": "干姜_baidu_zh.mp3",
  "延胡索": "延胡索_baidu_zh.mp3",
  "归来": "归来_baidu_zh.mp3",
  "当归": "当归_baidu_zh.mp3",
  "当阳": "当阳_google_zh-CN.mp3",
  "心俞": "心俞_baidu_zh.mp3",
  "悬钟": "悬钟_baidu_zh.mp3",
  "手三里": "手三里_baidu_zh.mp3",
  "手大指甲后": "手大指甲后_google_zh-CN.mp3",
  "手太阳": "手太阳_baidu_zh.mp3",
  "手逆注": "手逆注_baidu_zh.mp3",
  "支正": "支正_baidu_zh.mp3",
  "支沟": "支沟_baidu_zh.mp3",
  "旋覆花": "旋覆花_baidu_zh.mp3",
  "日月": "日月_baidu_zh.mp3",
  "昆仑": "昆仑_baidu_zh.mp3",
  "昆布": "昆布_baidu_zh.mp3",
  "曲池": "曲池_baidu_zh.mp3",
  "曲泉": "曲泉_baidu_zh.mp3",
  "曲泽": "曲泽_baidu_zh.mp3",
  "曲骨": "曲骨_baidu_zh.mp3",
  "期门": "期门_baidu_zh.mp3",
  "木瓜": "木瓜_baidu_zh.mp3",
  "木通": "木通_baidu_zh.mp3",
  "束骨": "束骨_baidu_zh.mp3",
  "条口": "条口_baidu_zh.mp3",
  "板蓝根": "板蓝根_baidu_zh.mp3",
  "板门": "板门_google_zh-CN.mp3",
  "枳实": "枳实_baidu_zh.mp3",
  "枸杞子": "枸杞子_baidu_zh.mp3",
  "柴胡": "柴胡_baidu_zh.mp3",
  "柿蒂": "柿蒂_baidu_zh.mp3",
  "栀子": "栀子_baidu_zh.mp3",
  "桂枝": "桂枝_baidu_zh.mp3",
  "桃仁": "桃仁_baidu_zh.mp3",
  "桔梗": "桔梗_baidu_zh.mp3",
  "梁丘": "梁丘_baidu_zh.mp3",
  "梁门": "梁门_baidu_zh.mp3",
  "气冲": "气冲_baidu_zh.mp3",
  "气海": "气海_baidu_zh.mp3",
  "气海俞": "气海俞_baidu_zh.mp3",
  "气舍": "气舍_baidu_zh.mp3",
  "水分": "水分_baidu_zh.mp3",
  "水泉": "水泉_baidu_zh.mp3",
  "没药": "没药_baidu_zh.mp3",
  "泽泻": "泽泻_baidu_zh.mp3",
  "浙贝母": "浙贝母_baidu_zh.mp3",
  "涌泉": "涌泉_baidu_zh.mp3",
  "温溜": "温溜_baidu_zh.mp3",
  "滑石": "滑石_baidu_zh.mp3",
  "然谷": "然谷_baidu_zh.mp3",
  "照海": "照海_baidu_zh.mp3",
  "牙痛": "牙痛_google_zh-CN.mp3",
  "牛膝": "牛膝_baidu_zh.mp3",
  "牡丹皮": "牡丹皮_baidu_zh.mp3",
  "牡蛎": "牡蛎_baidu_zh.mp3",
  "犊鼻": "犊鼻_baidu_zh.mp3",
  "独活": "独活_baidu_zh.mp3",
  "独阴": "独阴_baidu_zh.mp3",
  "猪苓": "猪苓_baidu_zh.mp3",
  "率谷": "率谷_google_zh-CN.mp3",
  "珍珠": "珍珠_baidu_zh.mp3",
  "珍珠母": "珍珠母_baidu_zh.mp3",
  "瓜蒌": "瓜蒌_baidu_zh.mp3",
  "甘草": "甘草_baidu_zh.mp3",
  "生姜": "生姜_baidu_zh.mp3",
  "申脉": "申脉_baidu_zh.mp3",
  "疰夏": "疰夏_google_zh-CN.mp3",
  "白及": "白及_baidu_zh.mp3",
  "白头翁": "白头翁_baidu_zh.mp3",
  "白术": "白术_baidu_zh.mp3",
  "白环俞": "白环俞_baidu_zh.mp3",
  "白芍": "白芍_baidu_zh.mp3",
  "白茅根": "白茅根_baidu_zh.mp3",
  "百会": "百会_baidu_zh.mp3",
  "益母草": "益母草_baidu_zh.mp3",
  "督俞": "督俞_baidu_zh.mp3",
  "瞳子髎": "瞳子髎_google_zh-CN.mp3",
  "知母": "知母_baidu_zh.mp3",
  "石决明": "石决明_baidu_zh.mp3",
  "石膏": "石膏_baidu_zh.mp3",
  "石菖蒲": "石菖蒲_baidu_zh.mp3",
  "石门": "石门_baidu_zh.mp3",
  "砂仁": "砂仁_baidu_zh.mp3",
  "神庭": "神庭_baidu_zh.mp3",
  "神门": "神门_baidu_zh.mp3",
  "章门": "章门_baidu_zh.mp3",
  "竹沥": "竹沥_baidu_zh.mp3",
  "筑宾": "筑宾_baidu_zh.mp3",
  "紫草": "紫草_baidu_zh.mp3",
  "红花": "红花_baidu_zh.mp3",
  "细辛": "细辛_baidu_zh.mp3",
  "经渠": "经渠_baidu_zh.mp3",
  "缺盆": "缺盆_baidu_zh.mp3",
  "翳明": "翳明_google_zh-CN.mp3",
  "耳门": "耳门_baidu_zh.mp3",
  "肝俞": "肝俞_baidu_zh.mp3",
  "肩中俞": "肩中俞_google_zh-CN.mp3",
  "肩贞": "肩贞_baidu_zh.mp3",
  "肩髃": "肩髃_baidu_zh.mp3",
  "肺俞": "肺俞_baidu_zh.mp3",
  "肾俞": "肾俞_baidu_zh.mp3",
  "胃俞": "胃俞_baidu_zh.mp3",
  "胆俞": "胆俞_baidu_zh.mp3",
  "脾俞": "脾俞_baidu_zh.mp3",
  "腕骨": "腕骨_baidu_zh.mp3",
  "腰痛点": "腰痛点_google_zh-CN.mp3",
  "腹哀": "腹哀_baidu_zh.mp3",
  "膀胱俞": "膀胱俞_baidu_zh.mp3",
  "膈俞": "膈俞_baidu_zh.mp3",
  "膻中": "膻中_baidu_zh.mp3",
  "至阴": "至阴_baidu_zh.mp3",
  "艾叶": "艾叶_baidu_zh.mp3",
  "芒硝": "芒硝_baidu_zh.mp3",
  "芦根": "芦根_baidu_zh.mp3",
  "苦杏仁": "苦杏仁_baidu_zh.mp3",
  "茜草": "茜草_baidu_zh.mp3",
  "茯苓": "茯苓_baidu_zh.mp3",
  "莪术": "莪术_baidu_zh.mp3",
  "葛根": "葛根_baidu_zh.mp3",
  "蒲公英": "蒲公英_baidu_zh.mp3",
  "薤白": "薤白_baidu_zh.mp3",
  "藕节": "藕节_baidu_zh.mp3",
  "蜈蚣": "蜈蚣_baidu_zh.mp3",
  "蠡沟": "蠡沟_baidu_zh.mp3",
  "血海": "血海_baidu_zh.mp3",
  "行间": "行间_baidu_zh.mp3",
  "解溪": "解溪_baidu_zh.mp3",
  "赤小豆": "赤小豆_baidu_zh.mp3",
  "赤芍": "赤芍_baidu_zh.mp3",
  "足三里": "足三里_baidu_zh.mp3",
  "足临泣": "足临泣_baidu_zh.mp3",
  "足窍阴": "足窍阴_baidu_zh.mp3",
  "足通谷": "足通谷_baidu_zh.mp3",
  "跗阳": "跗阳_baidu_zh.mp3",
  "车前子": "车前子_baidu_zh.mp3",
  "远志": "远志_baidu_zh.mp3",
  "连翘": "连翘_baidu_zh.mp3",
  "通天": "通天_google_zh-CN.mp3",
  "通里": "通里_baidu_zh.mp3",
  "郁金": "郁金_baidu_zh.mp3",
  "郄门": "郄门_baidu_zh.mp3",
  "酸枣仁": "酸枣仁_baidu_zh.mp3",
  "里内庭": "里内庭_baidu_zh.mp3",
  "金银花": "金银花_baidu_zh.mp3",
  "金门": "金门_baidu_zh.mp3",
  "钩藤": "钩藤_baidu_zh.mp3",
  "长强": "长强_baidu_zh.mp3",
  "间使": "间使_baidu_zh.mp3",
  "阳交": "阳交_baidu_zh.mp3",
  "阳池": "阳池_baidu_zh.mp3",
  "阳溪": "阳溪_baidu_zh.mp3",
  "阳陵泉": "阳陵泉_baidu_zh.mp3",
  "阴郄": "阴郄_baidu_zh.mp3",
  "附子": "附子_baidu_zh.mp3",
  "陷谷": "陷谷_baidu_zh.mp3",
  "隐白": "隐白_baidu_zh.mp3",
  "靠山": "靠山_google_zh-CN.mp3",
  "颊车": "颊车_baidu_zh.mp3",
  "颧髎": "颧髎_google_zh-CN.mp3",
  "风府": "风府_baidu_zh.mp3",
  "风池": "风池_google_zh-CN.mp3",
  "风门": "风门_baidu_zh.mp3",
  "飞扬": "飞扬_baidu_zh.mp3",
  "香附": "香附_baidu_zh.mp3",
  "鱼腰": "鱼腰_google_zh-CN.mp3",
  "鱼际": "鱼际_baidu_zh.mp3",
  "鳖甲": "鳖甲_baidu_zh.mp3",
  "鸠尾": "鸠尾_baidu_zh.mp3",
  "鸡血藤": "鸡血藤_baidu_zh.mp3",
  "麻黄": "麻黄_baidu_zh.mp3",
  "黄柏": "黄柏_baidu_zh.mp3",
  "黄精": "黄精_baidu_zh.mp3",
  "黄芩": "黄芩_baidu_zh.mp3",
  "黄芪": "黄芪_baidu_zh.mp3",
  "黄连": "黄连_baidu_zh.mp3",
  "龙骨": "龙骨_baidu_zh.mp3"
};

  let currentAudio = null;
  let currentButton = null;

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function normalizeHanzi(value){
    return String(value || "")
      .replace(/[​‌‍﻿]/g, "")
      .trim();
  }

  function getAudioFilenameForHanzi(hanzi){
    const clean = normalizeHanzi(hanzi);
    if(!clean) return "";
    return AUDIO_BY_HANZI[clean] || "";
  }

  function audioUrl(filename){
    return AUDIO_BASE_PATH + String(filename || "").split("/").map(encodeURIComponent).join("/");
  }

  function setButtonPlaying(button, isPlaying){
    document.querySelectorAll(".mtc-audio-button.mtc-audio-playing")
      .forEach(btn => {
        if(btn !== button) btn.classList.remove("mtc-audio-playing");
      });

    if(button){
      button.classList.toggle("mtc-audio-playing", Boolean(isPlaying));
    }
  }

  function stopCurrentAudio(){
    if(currentAudio){
      try{
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }catch(error){}
    }
    setButtonPlaying(currentButton, false);
    currentAudio = null;
    currentButton = null;
  }

  function playAudioForHanzi(hanzi, button){
    const clean = normalizeHanzi(hanzi);
    const filename = getAudioFilenameForHanzi(clean);
    if(!filename) return false;

    if(currentButton === button && currentAudio && !currentAudio.paused){
      stopCurrentAudio();
      return true;
    }

    stopCurrentAudio();

    const audio = new Audio(audioUrl(filename));
    audio.volume = 0.7;
    currentAudio = audio;
    currentButton = button || null;

    if(button){
      button.disabled = true;
      button.classList.add("mtc-audio-loading");
    }

    audio.addEventListener("canplaythrough", () => {
      if(button) button.disabled = false;
    }, {once:true});

    audio.addEventListener("ended", () => {
      setButtonPlaying(button, false);
      if(currentAudio === audio){
        currentAudio = null;
        currentButton = null;
      }
    });

    audio.addEventListener("error", () => {
      if(button){
        button.disabled = false;
        button.classList.remove("mtc-audio-loading", "mtc-audio-playing");
        button.title = "Audio introuvable ou illisible";
      }
      if(currentAudio === audio){
        currentAudio = null;
        currentButton = null;
      }
    });

    const playPromise = audio.play();
    if(playPromise && typeof playPromise.then === "function"){
      playPromise
        .then(() => {
          if(button){
            button.disabled = false;
            button.classList.remove("mtc-audio-loading");
            setButtonPlaying(button, true);
          }
        })
        .catch(() => {
          if(button){
            button.disabled = false;
            button.classList.remove("mtc-audio-loading", "mtc-audio-playing");
            button.title = "Clique encore si le navigateur a bloqué l’audio";
          }
        });
    }else{
      if(button){
        button.disabled = false;
        button.classList.remove("mtc-audio-loading");
        setButtonPlaying(button, true);
      }
    }

    return true;
  }

  function makeAudioButton(hanzi, filename){
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mtc-audio-button";
    button.textContent = "🔊";
    button.dataset.audioHanzi = hanzi;
    button.dataset.audioFile = filename || "";

    if(filename){
      button.title = "Écouter la prononciation";
      button.setAttribute("aria-label", "Écouter la prononciation de " + hanzi);

      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        playAudioForHanzi(hanzi, button);
      });
    }else{
      button.disabled = true;
      button.classList.add("mtc-audio-missing");
      button.title = "Audio non disponible";
      button.setAttribute("aria-label", "Audio non disponible pour " + hanzi);
    }

    return button;
  }

  function enhanceHeader(header){
    if(!header || header.dataset.mtcAudioEnhanced === "1") return;

    const hanziNode = header.querySelector(".point-hanzi-inline");
    const hanzi = normalizeHanzi(hanziNode ? hanziNode.textContent : "");
    const filename = getAudioFilenameForHanzi(hanzi);

    header.dataset.mtcAudioEnhanced = "1";

    if(!hanzi || !hanziNode){
      return;
    }

    const button = makeAudioButton(hanzi, filename);
    hanziNode.insertAdjacentElement("afterend", button);

    if(!filename){
      header.classList.add("mtc-audio-unavailable");
    }
  }

  function enhancePointPanel(){
    const content = document.getElementById("pointPanelContent");
    if(!content) return;

    content.querySelectorAll(".point-header").forEach(enhanceHeader);
  }

  function injectAudioStyles(){
    if(document.getElementById("mtc-audio-pronunciation-style")) return;

    const style = document.createElement("style");
    style.id = "mtc-audio-pronunciation-style";
    style.textContent = `
      .mtc-audio-button{
        appearance:none;
        border:0;
        background:transparent;
        color:currentColor;
        width:1.25em;
        min-width:1.25em;
        height:1.25em;
        margin:0 .16em 0 .22em;
        padding:0;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        font-size:.52em;
        line-height:1;
        cursor:pointer;
        opacity:.62;
        vertical-align:.08em;
        box-shadow:none;
        transform:none;
        transition:opacity .16s ease, transform .16s ease, color .16s ease;
      }
      .mtc-audio-button:hover,
      .mtc-audio-button:focus-visible{
        opacity:.95;
        transform:translateY(-1px);
        outline:none;
        box-shadow:none;
        background:transparent;
      }
      .mtc-audio-button:active{
        transform:translateY(0) scale(.94);
      }
      .mtc-audio-button.mtc-audio-loading{
        opacity:.42;
        cursor:wait;
      }
      .mtc-audio-button.mtc-audio-playing{
        opacity:1;
        background:transparent;
        box-shadow:none;
        transform:scale(1.05);
      }
      .mtc-audio-button.mtc-audio-missing,
      .mtc-audio-button:disabled{
        color:#8a8a8a;
        opacity:.42;
        cursor:default;
        transform:none;
        pointer-events:none;
      }
      .point-hanzi-inline + .mtc-audio-button{
        flex:0 0 auto;
      }
      .point-header .mtc-audio-button + .point-header-basket-button,
      .point-header .mtc-audio-button + .pharma-herb-panel-basket-add{
        margin-left:.35em;
      }
    `;
    document.head.appendChild(style);
  }

  function bootAudioEnhancer(){
    injectAudioStyles();
    enhancePointPanel();

    const content = document.getElementById("pointPanelContent");
    if(!content || content.dataset.mtcAudioObserver === "1") return;

    content.dataset.mtcAudioObserver = "1";
    const observer = new MutationObserver(() => enhancePointPanel());
    observer.observe(content, {childList:true, subtree:true});
  }

  window.mtcAudioByHanzi = AUDIO_BY_HANZI;
  window.mtcAudioFilenameForHanzi = getAudioFilenameForHanzi;
  window.playMtcAudioByHanzi = playAudioForHanzi;

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bootAudioEnhancer, {once:true});
  }else{
    bootAudioEnhancer();
  }
})();
