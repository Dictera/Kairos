import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

// eslint-config-next v16 ships native flat config arrays — spread them directly.
// (FlatCompat is no longer needed and crashes on the react plugin's self-reference.)
const eslintConfig = [
  {
    ignores: ['.claude/**', '.opencode/**', '.next/**', 'node_modules/**'],
  },
  ...coreWebVitals,
  ...typescript,
]

export default eslintConfig
