/* ============================================================
   18-16-true-slot-message.js
   Source: ancien bloc <script> #18 (hors JSON-LD)
   id original: -
   ============================================================ */

(function(){
  "use strict";

  const TAP_GUARD_MS = 650;
  let lastSupportCoffeeTapAt = 0;
  let lastSupportCoffeePointerDown = null;

  function getSupportCoffeeButtonFromEvent(event){
    if(!event) return document.getElementById("supportCoffeeButton");

    const target = event.target;

    if(target && typeof target.closest === "function"){
      const button = target.closest("#supportCoffeeButton");
      if(button) return button;
    }

    return document.getElementById("supportCoffeeButton");
  }

  function preventSupportCoffeeEvent(event){
    if(!event) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === "function"){
      event.stopImmediatePropagation();
    }
  }

  function pointerMovedTooMuch(event){
    if(!event || !lastSupportCoffeePointerDown) return false;

    const dx = Math.abs((event.clientX || 0) - lastSupportCoffeePointerDown.x);
    const dy = Math.abs((event.clientY || 0) - lastSupportCoffeePointerDown.y);

    return dx > 14 || dy > 14;
  }

  function triggerSupportCoffeeMessageFromTap(event){
    const button = getSupportCoffeeButtonFromEvent(event);
    if(!button) return false;

    if(event && event.type === "pointerup" && pointerMovedTooMuch(event)){
      return false;
    }

    const now = Date.now();
    if(now - lastSupportCoffeeTapAt < TAP_GUARD_MS){
      preventSupportCoffeeEvent(event);
      return false;
    }

    lastSupportCoffeeTapAt = now;
    preventSupportCoffeeEvent(event);

    if(typeof handleSupportCoffeeButtonClick === "function"){
      return handleSupportCoffeeButtonClick(event, button);
    }

    if(typeof showSupportCoffeeReminder === "function"){
      try{
        localStorage.setItem("mtc_support_coffee_return_eligible", "1");
      }catch(error){}
      showSupportCoffeeReminder();
    }

    return false;
  }

  function suppressSyntheticClickAfterTap(event){
    const button = getSupportCoffeeButtonFromEvent(event);
    if(!button) return;

    const now = Date.now();
    if(now - lastSupportCoffeeTapAt < TAP_GUARD_MS){
      preventSupportCoffeeEvent(event);
    }
  }

  function setupMobileSupportCoffeeTap(){
    const button = document.getElementById("supportCoffeeButton");
    if(!button || button.dataset.mobileSupportTapReady === "1") return;

    button.dataset.mobileSupportTapReady = "1";

    button.addEventListener("pointerdown", event=>{
      lastSupportCoffeePointerDown = {
        x:event.clientX || 0,
        y:event.clientY || 0
      };
    }, {capture:true, passive:true});

    button.addEventListener("pointerup", event=>{
      if(window.matchMedia && !window.matchMedia("(pointer: coarse), (max-width: 699px)").matches){
        return;
      }
      triggerSupportCoffeeMessageFromTap(event);
    }, {capture:true});

    /* Fallback iOS ancien : certains WebViews déclenchent touchend sans pointerup. */
    button.addEventListener("touchend", event=>{
      if(window.PointerEvent) return;
      triggerSupportCoffeeMessageFromTap(event);
    }, {capture:true});

    button.addEventListener("click", suppressSyntheticClickAfterTap, {capture:true});
  }

  document.addEventListener("DOMContentLoaded", setupMobileSupportCoffeeTap);

  if(document.readyState !== "loading"){
    setupMobileSupportCoffeeTap();
  }

  /* La goutte peut être déplacée dans body pendant la chute : on garde aussi
     un filet de sécurité en délégation, utile sur mobile. */
  document.addEventListener("pointerup", event=>{
    if(window.matchMedia && !window.matchMedia("(pointer: coarse), (max-width: 699px)").matches){
      return;
    }

    const target = event.target;
    if(!target || typeof target.closest !== "function") return;

    if(target.closest("#supportCoffeeButton")){
      triggerSupportCoffeeMessageFromTap(event);
    }
  }, {capture:true});
})();
