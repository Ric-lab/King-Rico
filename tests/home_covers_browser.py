"""Actual shared shine animation and original reel textures in the Home covers."""
def check_home_covers(page):
    covers=page.locator('.kr-game-cover')
    assert covers.count()==8
    backgrounds=covers.evaluate_all("els=>els.map(e=>getComputedStyle(e).backgroundImage)")
    assert len(set(backgrounds))==1 and '/assets/brand/covers/stage.webp' in backgrounds[0]
    objects=page.locator('.kr-cover-object')
    assert objects.count()==8
    for obj in objects.all():
        if 'kr-cover-object-fingo' in obj.get_attribute('class'):
            assert obj.locator('.kr-cover-fingo-peg').count()==39
            assert obj.locator('.kr-cover-fingo-funnel').count()==4
            assert obj.locator('.kr-cover-fingo-ball').all_text_contents()==['15','16','32','52','64']
            continue
        assert obj.evaluate(r"""async e=>{
          const src=getComputedStyle(e).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
          const image=new Image();image.src=src;await image.decode();
          const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
          const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
          const pixels=ctx.getImageData(0,0,image.width,image.height).data;
          let transparent=0,opaque=0;
          for(let i=3;i<pixels.length;i+=4){if(pixels[i]<=16)transparent++;if(pixels[i]>=240)opaque++;}
          return transparent>pixels.length/40 && opaque>pixels.length/40;
        }""")
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
    return {'shared_stage':True,'transparent_objects':7,'fingo_code_board':True,'original_reel_sprites':9,'moving_shine_on_covers':8,'reduced_motion':True}
