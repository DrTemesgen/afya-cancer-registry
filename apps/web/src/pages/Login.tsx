import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'
import { useSession, DEMO_USERS } from '../state/session'

export function Login() {
  const { t, i18n } = useTranslation()
  const { signIn, hierarchy } = useSession()

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <img src="/favicon.svg" alt="" />
          <div>
            <div className="t">{t('app.title')}</div>
            <div className="sub" style={{ margin: 0 }}>{t('app.tagline')}</div>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 12 }}>
          <label>{t('common.language')}</label>
          <select value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native}
              </option>
            ))}
          </select>
        </div>

        <h1 style={{ fontSize: '1.15rem' }}>{t('login.title')}</h1>
        <p className="sub">{t('login.subtitle')}</p>

        <div className="userlist">
          {DEMO_USERS.map((u) => {
            const node = hierarchy.get(u.nodeId)
            return (
              <button key={u.id} onClick={() => signIn(u.id)}>
                <span className="uname">{u.name}</span>
                <span className="urole">
                  {t(`roles.${u.role}`)} · {t('login.node')}: {node?.name ?? u.nodeId}
                </span>
              </button>
            )
          })}
        </div>

        <div className="notice warn">{t('login.demoNote')}</div>
      </div>
    </div>
  )
}
