import { initializeAnalytics, isSupported, logEvent, setUserId, setConsent, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import engine from './engine.cjs';

const definitions={account_created:[],spin_settled:['bet','payout','specialRound','operationId'],
  neck_step:['floor','move','success','operationId'],daily_bonus_claimed:['amount','operationId'],session_started:[],screen_viewed:[],engagement:['seconds'],client_error:['errorCode']};
const uuid=/^[0-9a-f-]{36}$/i;
export function eventParams(name,data) {
  if (!definitions[name] || Object.keys(data).some(k=>!['sessionId','game',...definitions[name]].includes(k)) ||
    !uuid.test(data.sessionId || '') || !['home','circus','wheel','neck'].includes(data.game)) return null;
  if(data.floor!==undefined && (!Number.isInteger(data.floor) || data.floor<0 || data.floor>33)) return null;
  if(data.move!==undefined && !['start','climb','collect'].includes(data.move)) return null;
  if(data.success!==undefined && typeof data.success!=='boolean') return null;
  if (data.operationId!==undefined && !uuid.test(data.operationId)) return null;
  if (data.errorCode!==undefined && !['auth','network','service'].includes(data.errorCode)) return null;
  if (data.seconds!==undefined && (!Number.isInteger(data.seconds) || data.seconds<1 || data.seconds>60)) return null;
  if (['bet','payout','amount'].some(k=>data[k]!==undefined && (!Number.isFinite(data[k]) || data[k]<0))) return null;
  return {game:data.game,tab_session_id:data.sessionId,rules_version:engine.RULES_VERSION,
    ...(data.bet!==undefined?{bet:data.bet}:{}),...(data.payout!==undefined?{payout:data.payout}:{}),
    ...(data.amount!==undefined?{amount:data.amount}:{}),...(data.specialRound!==undefined?{special_round:data.specialRound?1:0}:{}),
    ...(data.floor!==undefined?{floor:data.floor}:{}),...(data.move!==undefined?{move:data.move}:{}),...(data.success!==undefined?{success:data.success?1:0}:{}),
    ...(data.operationId?{operation_id:data.operationId}:{}),...(data.seconds?{seconds:data.seconds}:{}),
    ...(data.errorCode?{error_code:data.errorCode}:{})};
}

// No event documents, TTL or Functions. GA4 is optional; gameplay never waits for it.
export function createTelemetry(app,config,sdk={initializeAnalytics,isSupported,logEvent,setUserId,setConsent,setAnalyticsCollectionEnabled}) {
  let analytics, initializing, owner=null, consent=false;
  const queue=[];
  function enabled() { return consent && owner && config.firebase.measurementId && !config.emulators; }
  function apply() {
    if (typeof window!=='undefined' && config.firebase.measurementId) window['ga-disable-'+config.firebase.measurementId]=!enabled();
    if (!analytics) return;
    sdk.setConsent({analytics_storage:enabled()?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    sdk.setAnalyticsCollectionEnabled(analytics,!!enabled());
    sdk.setUserId(analytics,enabled()?owner:null);
  }
  function flush() {
    if (!analytics || !enabled()) return;
    for (const [name,params] of queue.splice(0)) sdk.logEvent(analytics,name,params);
  }
  async function initialize() {
    if (analytics || initializing || !enabled()) return;
    initializing=true;
    try {
      if (await sdk.isSupported() && enabled()) {
        sdk.setConsent({analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
        analytics=sdk.initializeAnalytics(app,{config:{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false}});
        apply();flush();
      }
    } catch { queue.length=0; } // A blocked analytics endpoint must not block login/spins.
    finally { initializing=false; }
  }
  return {
    sync(player,uid) {
      if (owner!==uid || !player?.analyticsConsent) queue.length=0;
      owner=uid;consent=player?.analyticsConsent===true;apply();
      if (enabled()) { initialize();flush(); }
    },
    clear() {queue.length=0;},
    track(name,data) {
      if (!enabled()) return;
      const params=eventParams(name,data);
      if (!params) return;
      if (analytics) sdk.logEvent(analytics,name,params);
      else if (queue.length<20) queue.push([name,params]);
    }
  };
}
