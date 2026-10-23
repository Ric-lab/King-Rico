"""Actual shared shine animation and original reel textures in the Home covers."""
def check_home_covers(page):
    covers=page.locator('.kr-game-cover')
    assert covers.count()==8
    reels=page.locator('.kr-cover-reel')
    assert reels.count()==9
    for reel in reels.all():
        assert reel.evaluate('e=>getComputedStyle(e).backgroundImage.includes("/assets/symbols-v7.webp")')
        assert reel.bounding_box()['width']>0
    for cover in covers.all():
        motion=cover.evaluate('''async e=>{
          const animation=e.getAnimations({subtree:true}).find(a=>a.animationName==='krCoverShine');
          if(!animation)return null;
          const delay=animation.effect.getTiming().delay;
          animation.pause();await animation.ready;animation.currentTime=4200+delay+350;
          await new Promise(requestAnimationFrame);
          const before=getComputedStyle(e,'::after').transform;
          animation.currentTime=4200+delay+1050;
          await new Promise(requestAnimationFrame);
          const after=getComputedStyle(e,'::after').transform;
          animation.currentTime=4200+delay+2000;
          return {before,after,pointer:getComputedStyle(e,'::after').pointerEvents};
        }''')
        assert motion and motion['before']!=motion['after'],motion
        assert motion['pointer']=='none'
    page.emulate_media(reduced_motion='reduce')
    for cover in covers.all():assert cover.evaluate('e=>getComputedStyle(e,"::after").animationName')=='none'
    page.emulate_media(reduced_motion='no-preference')
    # Capture unobscured artwork after checking movement.
    page.evaluate('''()=>document.querySelectorAll('.kr-game-cover').forEach(e=>e.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=4200+a.effect.getTiming().delay+2000;}))''')
    return {'original_reel_sprites':9,'moving_shine_on_covers':8,'reduced_motion':True}
