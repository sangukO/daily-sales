import { db } from "@/lib/db";

async function handleResetAllData() {
  if (
    !window.confirm(
      `정말로 모든 데이터를 삭제하시겠습니까?
이 작업은 되돌릴 수 없습니다.`
    )
  ) {
    return;
  }

  try {
    await db.sales.clear();
    console.log("모든 데이터가 초기화되었습니다.");
  } catch (error) {
    console.error("데이터 초기화 실패:", error);
  }
}

function Settings() {
  return (
    <div>
      <ul>
        <li
          className="list-disc cursor-pointer border-b border-gray-500"
          onClick={handleResetAllData}
        >
          데이터 초기화
        </li>
      </ul>
    </div>
  );
}

export default Settings;
