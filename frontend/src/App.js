// frontend/src/App.js

import React from 'react'; // React 라이브러리 불러오기

// 1. 전역 CSS 파일 불러오기
import './global.css'; // global.css 파일의 상대 경로를 정확히 지정해주세요.

// 2. 개별 컴포넌트들 불러오기
import Header from './components/Header'; // Header 컴포넌트의 상대 경로
import Footer from './components/Footer'; // Footer 컴포넌트의 상대 경로

// App 컴포넌트 정의
function App() {
  return (
    // 3. 전체 페이지를 감싸는 최상위 div (또는 React.Fragment)
    // className은 global.css에 정의된 스타일을 적용하기 위해 사용합니다.
    <div className="container"> {/* 예시: global.css에 .container 스타일이 정의되어 있다고 가정 */}

      {/* 4. Header 컴포넌트 사용 */}
      <Header />

      {/* 5. 메인 콘텐츠 영역 */}
      {/* 이 부분은 나중에 페이지별로 다른 내용을 보여주기 위해 라우팅 등을 설정하게 됩니다. */}
      <main className="main-content"> {/* 예시: global.css에 .main-content 스타일이 정의되어 있다고 가정 */}
        <h2>공부는 평생 해야지</h2>
        <p>미친듯이 문제를 풀도록</p>
        {/* 
          여기에 추가적인 컴포넌트나 내용을 넣을 수 있습니다.
          예를 들어, 문제 목록을 보여주는 <QuestionList /> 컴포넌트 등
        */}
      </main>

      {/* 6. Footer 컴포넌트 사용 */}
      <Footer />

    </div>
  );
}

// App 컴포넌트를 다른 파일에서 사용할 수 있도록 내보내기
export default App;