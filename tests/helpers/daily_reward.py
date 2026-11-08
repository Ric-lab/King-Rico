def collect_daily(page):
    """Use the accessible equivalent of scratching in unrelated game checks."""
    page.wait_for_function('window.KingRicoCloud?.player&&!document.querySelector("#kr-boot-screen")')
    gift=page.get_by_role('dialog',name='Presente do dia',exact=True)
    page.wait_for_function('KingRicoCloud.dailyRewardActive||KingRicoCloud.player.bonus.day===String(KingRicoCloud.dayKey()).replace(/(....)(..)(..)/,"$1-$2-$3")')
    if gift.count():
        reveal=gift.get_by_role('button',name='REVELAR',exact=True)
        if reveal.count():reveal.click()
        gift.get_by_role('button',name='PEGAR MOEDAS',exact=True).click()
        gift.wait_for(state='detached')
