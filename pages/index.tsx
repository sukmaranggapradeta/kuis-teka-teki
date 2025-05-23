/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Button,
  Input,
  Card,
  Typography,
  List,
  Space,
  message,
  Progress,Flex
} from "antd";

const { Title, Text } = Typography;

interface Question {
  question: string;
  options: string[];
  answer: string;
  image?: string; // Tambahkan properti image
  timeLimit?: number; // opsional
}

interface LeaderboardEntry {
  name: string;
  score: number;
}

export default function QuizApp() {
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [canAnswer, setCanAnswer] = useState<boolean>(false);
//   const [showLeaderboard, setShowLeaderboard] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  // const [hasAnswered, setHasAnswered] = useState(false);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);

  const ADMIN_NAME = "sukma-rangga-admin-dayalima";

  const playBeep = () => {
    const audio = new Audio("/sounds/beep-sound-8333.mp3");
    audio.play();
  };

  const questions: Question[] = [
    {
      question: "Kamu sedang dalam perjalanan melintasi hutan sendirian. <br>Suatu pagi, kamu mendapati bahwa kamu hampir kehabisan air. <br> Kamu bisa mendapat tambahan air dari salah satu dari 4 sumber air: <br>Sumber air mana yang akan kamu pilih untuk mengisi botol minum penyaring airmu?",
      options: ["Kaktus berair", "Sebuah kolam air laut asin", "Sebuah danau yang tenang dan bening", "Anak sungai yang ada endapannya"],
      answer: "Anak sungai yang ada endapannya",
      image: "/images/masalah-di-hutan.png", // URL gambar
      timeLimit:35,
    },
    {
      question: "Mark dan James bermain bersama di loteng yang gelap dan berdebu.<br>Setelah turun, wajah Mark kotor penuh debu, sedangkan wajah James bersih. <br>Namun hanya satu dari mereka yang akan pergi mencuci muka.<br>Siapa yang akan mencuci muka?",
      options: ["Mark", "James","Keduanya"],
      answer: "James",
      image: "/images/masalah-di-loteng.png", // URL gambar
      timeLimit:35,
    },
    {
      question: "Seorang pemburu harta karun tersesat di dalam hutan. <br>Setelah berjalan cukup lama, ia tiba di sebuah persimpangan jalan. <br>Di tengah persimpangan itu ada sebuah batu besar dengan tulisan aneh:<br> “4 + no5” <br> Pemburu itu tahu, arah jalan yang benar tersembunyi dalam tulisan tersebut.<br>Menurutmu, ke arah mana seharusnya ia berjalan?",
      options: ["North", "South","East","West"],
      answer: "South",
      image: "/images/peta-harta-karun.png", // URL gambar
      timeLimit:30,
    },
    {
      question: "Kamu diculik dan disekap di dalam sebuah rumah batu.  <br>Di sana ada empat pintu yang bisa kamu pilih untuk melarikan diri. <br> Tapi masing-masing pintu punya bahaya mematikan<br> Pintu mana yang kamu pilih?",
      options: ["Pintu yang menuju ruang es beku — kamu akan membeku dalam hitungan detik.", "Pintu yang berisi tangki penuh hiu-hiu lapar.","Pintu yang langsung menghadap matahari super panas yang bisa membakar apa pun seketika.","pintu berisi gas beracun yang tidak memungkinkan untuk bernapas"],
      answer: "Pintu yang langsung menghadap matahari super panas yang bisa membakar apa pun seketika.",
      image: "/images/pintu-batu.png", // URL gambar
      timeLimit:40,
    },
    {
      question: "Saat berlibur di hutan, Kamu ditangkap oleh suku lokal.  <br>Kamu diikat dan diberi pilihan yang mengerikan:  <br>akan dijatuhkan ke salah satu dari tiga lubang maut. <br>Hanya satu pilihan yang bisa menyelamatkan nyawanya. <br>Lubang mana yang harus kamu pilih?",
      options: ["Lubang dipenuhi zombie.", "Lubang dengan kobaran api.","Lubang dipenuhi tumbuhan karnivora."],
      answer: "Lubang dipenuhi tumbuhan karnivora.",
      image: "/images/lubang-maut.jpeg", // URL gambar
      timeLimit:40,
    },
    {
      question: "Bayangkan kamu adalah seorang pengembara.<br>Kamu sudah berjalan seharian di tengah gurun, tanpa setetes air pun. <br>Kakimu lelah, tenggorokan kering, dan mata mulai kabur karena panas.<br>Kamu memanjat bukit kecil dan melihat tiga danau di kejauhan.<br>Semua terlihat menjanjikan. Tapi… hanya satu yang asli.",
      options: ["Danau 1","Danau 2","Danau 3"],
      answer: "Danau 3",
      image: "/images/danau-fatamorgana.png", // URL gambar
      timeLimit:30,
    },
    {
      question: "Seorang pria kaya pergi ke sebuah pameran seni modern. <br> Ia berniat membeli sebuah lukisan untuk koleksinya. <br> Pemilik pameran menunjukkan tiga karya dari seniman yang berbeda.<br>Sang kolektor yakin bahwa salah satu lukisan itu palsu.<br>Lukisan mana yang menurutmu palsu?",
      options: ["Lukisan pertama: Sebuah segitiga hijau dengan bunga matahari di tengahnya.","Lukisan kedua: Seekor singa yang sedang selfie menggunakan HP","Lukisan ketiga: Sebuah rumah terbang di udara"],
      answer: "Lukisan kedua: Seekor singa yang sedang selfie menggunakan HP",
      image: "/images/lukisan-palsu.jpeg", // URL gambar
      timeLimit:40,
    },
    {
      question: "Tombol mana yang kamu pilih?",
      options: ["Merah","Ungu","Kuning"],
      answer: "Ungu",
      image: "/images/tombol-rahasia.jpeg", // URL gambar
      timeLimit:25,
    },
    {
      question: "Kotak mana yang lebih besar",
      options: ["Putih","Kuning","Hitam","Hijau"],
      answer: "Hijau",
      image: "/images/kotak-terbesar.jpeg", // URL gambar
      timeLimit:20,
    },
    {
      question: "Rute jalan manakah yang benar",
      options: ["Rute A","Rute B","Rute C","Rute D"],
      answer: "Rute B",
      image: "/images/jalur-labirin.jpeg", // URL gambar
      timeLimit:20,
    },

  ];

  useEffect(() => {
    const savedName = localStorage.getItem("quizName");
    if (savedName) {
      setName(savedName);
      const isAdmin = savedName === ADMIN_NAME;
      setIsAdmin(isAdmin);
      setHasJoined(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaderboard"), (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as LeaderboardEntry;
        if (data.name !== ADMIN_NAME) entries.push(data);
      });
      setLeaderboard(entries);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "quizState", "status"), (docSnap) => {
      const data = docSnap.data();
      if (data) {
        setQuestionIndex(data.currentQuestionIndex);
        setCanAnswer(data.quizStarted);
        if (data.quizStarted) {
          setTimeLeft(35);
          setTimerActive(true);
        }
        
        if (!isAdmin) {
          setCanAnswer(data.quizStarted);
        }
      } else {
        setDoc(doc(db, "quizState", "status"), {
          quizStarted: false,
          currentQuestionIndex: 0,
        });
      }
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) {
       
      setCanAnswer(false);
      setTimerActive(false);
      // setHasAnswered(true);
      return;
    }
    const timer = setTimeout(() => {
      if (timeLeft <= 10) playBeep();
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive]);

  const joinRoom = async () => {
    if (!name.trim()) return;
    localStorage.setItem("quizName", name);
    const isAdmin = name === ADMIN_NAME;
    setIsAdmin(isAdmin);
    setHasJoined(true);

    if (!isAdmin) {
      await setDoc(doc(db, "leaderboard", name), {
        name,
        score: 0,
      });
    }

    const docSnap = await getDoc(doc(db, "quizState", "status"));
    const data = docSnap.data();
    if (data && data.quizStarted && !isAdmin) {
      setQuestionIndex(data.currentQuestionIndex);
      setCanAnswer(true);
      setTimeLeft(35);
      setTimerActive(true);
    }
  };

  const logout = async () => {
    localStorage.removeItem("quizName");
    setHasJoined(false);
    setName("");
    setIsAdmin(false);
    setSelectedOption(null);
    setScore(0);
    setCanAnswer(false);
    setTimerActive(false);
    if (name && name !== ADMIN_NAME) {
      await deleteDoc(doc(db, "leaderboard", name));
    }
  };


  const handleAnswer = async () => {
    if (!canAnswer || !selectedOption || isAdmin) return;

    // let additionalScore = Math.ceil(timeLeft / 3); // Setiap 3 detik tersisa, tambah 1 poin
    let totalScore = score;
  
    if (selectedOption === questions[questionIndex].answer) {
      totalScore += 10 + Math.ceil(timeLeft / 3);
      setScore(totalScore);
      await updateDoc(doc(db, "leaderboard", name), {
        score: totalScore,
      });
      message.success("Jawaban benar!");
    } else {
      message.error("Jawaban salah!");
    }
  
    setCanAnswer(false);
  };

  const startQuiz = async () => {
    if (isAdmin) {
      await setDoc(doc(db, "quizState", "status"), {
        quizStarted: true,
        currentQuestionIndex: 0,
      });
    }
  };

  const resetQuiz = async () => {
    if (isAdmin) {
      await setDoc(doc(db, "quizState", "status"), {
        quizStarted: false,
        currentQuestionIndex: 0,
      });
    }
  };

  const nextQuestion = async () => {
    if (isAdmin && questionIndex + 1 < questions.length) {
      await updateDoc(doc(db, "quizState", "status"), {
        currentQuestionIndex: questionIndex + 1,
        quizStarted: true,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "quizState", "status"), (docSnap) => {
      const data = docSnap.data();
      if (data) {
        setQuestionIndex(data.currentQuestionIndex);
        setQuizStarted(data.quizStarted); // Tambahkan ini
        if (data.quizStarted) {
          setTimeLeft(35);
          setTimerActive(true);
        }
  
        if (!isAdmin) {
          setCanAnswer(data.quizStarted);
        }
      } else {
        setDoc(doc(db, "quizState", "status"), {
          quizStarted: false,
          currentQuestionIndex: 0,
        });
      }
    });
    return () => unsubscribe();
  }, [isAdmin]);

  
  const currentTimeLimit = questions[questionIndex]?.timeLimit || 30
  if (!hasJoined) {
    return (
      <Card style={{ maxWidth: 480, margin: "2rem auto" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={4}>Masukkan Nama</Title>
          <Input
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyPress} // Tangani event Enter
          />
          <Button type="primary" onClick={joinRoom} block>
            Masuk
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 1024, margin: "2rem auto" }}>

{
    !isAdmin &&    <Flex gap="middle" justify={"space-between"}>
    <Text strong>Nama Anda: {name}</Text>
    <Button danger style={{ marginTop: 8 }} onClick={logout}>
      Keluar
    </Button>
    </Flex>
}


      {isAdmin && (
        <Space direction="vertical" style={{ marginTop: 20, width: "100%" }}>

          <Button type="primary" block onClick={startQuiz}>
            Mulai Kuis
          </Button>
          <Button type="primary" block onClick={resetQuiz}>
            Reset Kuis
          </Button>
          <Button type="dashed" block onClick={nextQuestion}>
            Soal Selanjutnya
          </Button>
        </Space>
      )}
{questions[questionIndex] && quizStarted  && (
  <div style={{ marginTop: 24 }}>
    <Title level={4}>
      <span
        dangerouslySetInnerHTML={{ __html: questions[questionIndex].question }}
      ></span>
    </Title>

    {questions[questionIndex].image && (
      <img
        src={questions[questionIndex].image}
        alt="gambar soal"
        style={{ maxWidth: "100%", marginBottom: "1rem" }}
      />
    )}

    <Progress
      percent={(timeLeft / currentTimeLimit) * 100}
      format={() => `${timeLeft}s`}
      showInfo
    />

    {!isAdmin && (
      <Space direction="vertical" style={{ width: "100%" }}>
        {questions[questionIndex].options.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          let type: "default" | "primary" = "default";

          if (isSelected) {
            type = "primary";
          }

          return (
            <Button
            block
              key={idx}
               style={{ whiteSpace: "normal", wordBreak: "break-word", height: "auto", padding: "8px 16px"}}
              type={type}
              disabled={!canAnswer} // tetap disable saat waktu habis
              onClick={() => setSelectedOption(opt)}
            >
              {opt}
            </Button>
          );
        })}
        <Button
          type="primary"
          block
          disabled={!selectedOption || !canAnswer}
          onClick={handleAnswer}
        >
          Jawab
        </Button>
      </Space>
    )}
  </div>
)}

{!quizStarted && (
  <Text type="secondary" style={{ marginTop: 16, display: "block" }}>
    Kuis belum dimulai.
  </Text>
)}

        <div style={{ marginTop: 32 }}>
          <Title level={4}>Leaderboard</Title>
          <List
            bordered
            dataSource={leaderboard.sort((a, b) => b.score - a.score)}
            renderItem={(entry, idx) => (
              <List.Item>
                <Text>{idx + 1}. {entry.name}</Text>
                <Text strong>{entry.score}</Text>
              </List.Item>
            )}
          />
        </div>
    </Card>
  );
}
