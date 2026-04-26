import { GoogleGenAI } from "@google/genai";
import { Question, ExamConfig } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to convert File to base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

const REFERENCE_TIKZ_CODE = `
%%%%KHAI BÁO BAN ĐẦU
\\begin{tikzpicture}[scale=1, font=\\footnotesize, line join=round, line cap=round,>=stealth, thick]
%%%body code
\\end{tikzpicture}
%%%%
   - Dùng lệnh khai báo điểm:
     \\coordinate (A) at (...);
   - Dùng nét vẽ chuẩn:
     \\draw (A)--(B)--(C)--cycle;

dùng lệnh sau (Từ B kẻ BH vuông góc với AD tại H)
\\draw (B) -- ($(A)!(B)!(D)$) coordinate(H); 
\\pic[draw,thin,angle radius=3mm] {right angle = A--H--B}; 

% -- M là trung điểm BC hoặc AM là đường trung tuyến
\\coordinate(M) at ($(B)!0.5!(C)$); % Khai báo M là trung điểm cạnh BC
\\draw (A)--(M); % Vẽ đường trung tuyến AM

% -- BI là đường phân giác của góc ABC
\\path let \\p1=($(B)-(A)$), \\p2=($(B)-(C)$), \\n1={veclen(\\x1,\\y1)},\\n2={veclen(\\x2,\\y2)} in ($(A)!scalar(\\n1/(\\n1+\\n2))!(C)$) coordinate (I);
\\draw (B)--(I); % Vẽ đường phân giác BD

% -- Vẽ tam giác ABC vuông tại C, 
\\draw (A)--(B)--(tamgiacvuong cs:on=A--B) coordinate(C)--cycle;

% -- Vẽ tam giác ABC cân tại A
\\coordinate (A) at (0,5);
\\coordinate (B) at (-2,0);
\\coordinate (C) at (2,0);
\\path (A)--(B) node[midway,sloped,scale=0.5]{$|$};
\\path (A)--(C) node[midway,sloped,scale=0.5]{$|$};
\\draw(A)--(B)--(C)--cycle;

% -- Vẽ tam giác đều ABC (độ dài cạnh = \\canh)
\\def\\canh{5}
\\coordinate (B) at (0,0);
\\coordinate (C) at (\\canh,0);
\\coordinate (A) at ($(B) + (60:\\canh)$);
\\draw(A)--(B)--(C)--cycle;
\\path (A)--(B) node[midway,sloped,scale=0.5]{$|$};
\\path (A)--(C) node[midway,sloped,scale=0.5]{$|$};
\\path (B)--(C) node[midway,sloped,scale=0.5]{$|$};

% -- Vẽ đường tròn ngoại tiếp tam giác ABC, tâm O
\\circumcenter(A,B,C)(O) % Xác định tâm O
\\circumradius(A,B,C)(\\R)
\\draw (O) circle(\\R);   % Vẽ đường tròn ngoại tiếp

% -- Vẽ đường tròn tâm A, bán kính 3cm (tên đường tròn T)
\\path[name path=T] (A) circle (3 cm);

% -- Vẽ đường tròn tâm A, đi qua điểm M
\\draw  let \\p1=($(M)-(A)$) in (A) circle({veclen(\\x1,\\y1)});

% -- Vẽ hai đường thẳng AB và MN song song
\\coordinate (N) at ($(B)+(M)-(A)$);
\\draw (N)--(M); % MN // AB

% -- Vẽ tiếp tuyến tại M, thuộc đường tròn tâm A (có sẵn A, M)
\\coordinate (Tempt1) at ($(M)!1cm!90:(A)$);
\\coordinate (Tempt2) at ($(M)!0cm!-90:(A)$);
\\draw (Tempt1)--(Tempt2);

% -- Vẽ tiếp tuyến đường tròn tâm O, bán kính 2cm từ M
\\path[name path=dt1] (O) circle(2 cm);
\\path[name path=dt2] let \\p1=($(O)-($(O)!0.5!(M)$)$) in ($(O)!0.5!(M)$) circle({veclen(\\x1,\\y1)});
\\path [name intersections = {of = dt1 and dt2 }]
(intersection-1) coordinate (A)
(intersection-2) coordinate (B);
\\draw (O)--(A)--(M)--(B)--cycle (O)--(M) (A)--(B);

% -- Vẽ AB cắt CD tại O (giao điểm)
\\coordinate (O) at (intersection of A--B and C--D);

% -- 2 đường tròn T và P cắt nhau tại A,B
\\path [name intersections={of=T and P,by={A,B}}];

% -- B là điểm đối xứng với A qua O
\\coordinate (B) at ($(O)!-1!(A)$);

% -- Vẽ hình thang cân ABCD
\\coordinate (A) at (1,3);
\\coordinate (B) at (4,3);
\\coordinate (D) at (0,0);
\\coordinate (C) at (5,0);
\\draw(A)--(B)--(C)--(D)--cycle;

% -- Vẽ hình bình hành ABCD
\\coordinate (A) at (1,3);
\\coordinate (B) at (6,3);
\\coordinate (D) at (0,0);
\\coordinate (C) at ($(B)+(D)-(A)$);
\\draw(A)--(B)--(C)--(D)--cycle;

% -- Vẽ hình thoi ABCD, cạnh = 4
\\def\\canh{4}
\\coordinate (A) at (0,0);
\\coordinate (B) at ($(A)+(-65:\\canh)$);
\\coordinate (D) at ($(A)+(-115:\\canh)$);
\\coordinate (C) at ($(B)+(D)-(A)$);
\\draw(A)--(B)--(C)--(D)--cycle;

% -- Vẽ hình chữ nhật ABCD
\\coordinate (A) at (0,3);
\\coordinate (B) at (5,3);
\\coordinate (D) at (0,0);
\\coordinate (C) at ($(B)+(D)-(A)$);
\\draw(A)--(B)--(C)--(D)--cycle;

% -- Vẽ hình vuông ABCD, cạnh = 4
\\def\\canh{4}
\\coordinate (A) at (0,\\canh);
\\coordinate (B) at (\\canh,\\canh);
\\coordinate (D) at (0,0);
\\coordinate (C) at ($(B)+(D)-(A)$);
\\draw(A)--(B)--(C)--(D)--cycle;
\\path (A)--(B) node[midway,sloped,scale=0.2]{$|$};
\\path (C)--(D) node[midway,sloped,scale=0.2]{$|$};

% -- Lấy điểm A thuộc đường tròn tâm O, bán kính 3 cm, góc 40 độ
\\coordinate (A) at ($(O) + (40:3)$);

% -- G là trọng tâm tam giác ABC
\\coordinate (G) at ($1/3*(A)+1/3*(B)+1/3*(C)$);
\\draw (A)--($(B)!0.5!(C)$) (B)--($(A)!0.5!(C)$) (C)--($(B)!0.5!(A)$);

% -- H là trực tâm tam giác ABC
\\coordinate (HCBAC) at ($(A)!(B)!(C)$);
\\coordinate (HCCAB) at ($(A)!(C)!(B)$);
\\coordinate (H) at (intersection of B--HCBAC and C--HCCAB);
\\draw (A)--($(B)!(A)!(C)$) (B)--($(A)!(B)!(C)$) (C)--($(B)!(C)!(A)$);

% -- Từ M kẻ đường thẳng //CD, cắt AB tại N, vẽ MN
\\draw (M)--(songsong cs:from=M, to=C--D, on=A--B) coordinate(N);

% -- N là điểm đối xứng A qua M, vẽ AN
\\draw (A)--(doixungtam cs:from=A,to=M) coordinate(N);

%% =============== HÌNH KHÔNG GIAN ===============
% -- Vẽ hình nón
\\begin{tikzpicture}[line join=round, line cap=round, font=\\scriptsize]
  \\def\\a{2}
  \\def\\b{1}
  \\def\\h{4}
  \\draw[dashed] (180:\\a) arc (180:0:{\\a} and {\\b})
                (90:\\h)--(0,0) node[midway,right]{$h$} 
                (0,0)--(0:\\a);
  \\draw (-\\a,\\h)--(-\\a,0) 
        arc (180:360:{\\a} and {\\b})--(\\a,\\h) node[midway,right]{$l$}
        (90:\\h) ellipse ({\\a} and {\\b})
        (90:\\h)--(\\a,\\h) node[midway,above]{$r$};
\\end{tikzpicture}

% -- Vẽ hình trụ
\\begin{tikzpicture}[line join=round, line cap=round, font=\\scriptsize]
  \\def\\a{2} \\def\\b{1} \\def\\h{3}
  \\pgfmathsetmacro\\g{asin(\\b/\\h)}
  \\pgfmathsetmacro\\xo{\\a*cos(\\g)}
  \\pgfmathsetmacro\\yo{\\b*sin(\\g)}
  \\draw[dashed](\\xo,\\yo) arc (\\g:180-\\g:{\\a} and {\\b})(180:\\a)--(0,0) 
        node[midway,below]{$r$} (0,0)--(0:\\a) (90:\\h)--(0,0) node[midway,right]{$h$};
  \\draw (90:\\h)--(-\\xo,\\yo) node[midway,sloped,above]{$l$}
        arc(180-\\g:360+\\g:{\\a} and {\\b})--cycle;
\\end{tikzpicture}

% -- Vẽ hình cầu, bán kính = 3
\\begin{tikzpicture}
  \\def\\r{3}
  \\draw[dashed](180:\\r) arc (180:0:{\\r} and {.3*\\r})
               (90:\\r) arc (90:-90:{.3*\\r} and {\\r})
               (0,0) node[below]{$O$}--(30:\\r) circle(0.04) 
               node[right]{$A$} node[midway,above]{$r$};
  \\draw (0:0) circle(\\r)
        (180:\\r) arc(180:360:{\\r} and {.3*\\r})
        (90:\\r) arc(90:270:{.3*\\r} and {\\r});
  \\draw (0,0) circle(0.04) (30:\\r) circle(0.04);
\\end{tikzpicture}

% -- Vẽ hình hộp chữ nhật ABCD.MNPQ
\\begin{tikzpicture}[scale=1,font=\\footnotesize, join=round, line cap=round, >=stealth]
  \\path (-1,-1) coordinate(A) (0,0) coordinate(B) (3,0) coordinate(C)
    ($(A)+(C)-(B)$) coordinate(D) (0,2) coordinate(N)
    ($(A)+(N)-(B)$) coordinate(M) ($(M)+(C)-(B)$) coordinate(Q)
    ($(N)+(Q)-(M)$) coordinate(P);
  \\draw (A)--(M)--(N)--(P)--(C)--(D)--cycle (M)--(Q)--(D) (Q)--(P);
  \\draw[dashed](A)--(B)--(C) (B)--(N);
  \\foreach \\x/\\g in {A/180,B/180,C/0,D/0,M/180,N/180,P/0,Q/0}
    \\fill[black](\\x) circle(1pt) ($( \\x )+(\\g:3mm)$) node{\\footnotesize $\\x$};
\\end{tikzpicture}

% -- Vẽ lăng trụ đứng tam giác ABC.A'B'C'
\\begin{tikzpicture}[scale=.7, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\a{3} \\def\\b{4} \\def\\c{5} \\def\\h{6}
  \\coordinate (A) at (0,0); \\coordinate (B) at (0:\\c);
  \\path [name path=c1] (A) circle(\\b); \\path [name path=c2] (B) circle(\\a);
  \\path [name intersections={of=c1 and c2,by={D,C}}];
  \\coordinate (A') at ($(A)+(90:\\h)$); \\coordinate (B') at ($(B)-(A)+(A')$); \\coordinate (C') at ($(C)-(A)+(A')$);
  \\draw (A')--(A)--(C) node[below,midway,sloped]{$4 cm$} --(B) node[below,midway,sloped]{$3 cm$} --(B')--(A')--(C')--(B') (C)--(C');
  \\draw[dashed] (A)--(B) node[above,midway,sloped]{$5 cm$}; \\draw[dashed] (B)--(B') node[right,midway]{$6 cm$};
  \\foreach \\diem/\\g in {A/180,B/0,C/270,A'/90,B'/90,C'/90} \\fill (\\diem) circle(1.5pt) +(\\g:.3) node{$\\diem$};
\\end{tikzpicture}

% -- Vẽ hình chóp tam giác đều S.ABC
\\begin{tikzpicture}[scale=1, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\ac{4} \\def\\ab{2} \\def\\h{4} \\def\\gocA{50}
  \\coordinate[label=left:$A$] (A) at (0,0); \\coordinate[label=right:$C$] (C) at (\\ac,0); \\coordinate[label=below left:$B$] (B) at (-\\gocA:\\ab);
  \\coordinate (M) at ($(B)!.5!(C)$); \\coordinate[label=below right:$O$] (G) at ($(A)!2/3!(M)$);
  \\coordinate[label=above:$S$] (S) at ($(G)+(90:\\h)$);
  \\draw (A)--(B)--(C)--(S)--cycle (S)--(B); \\draw[dashed] (A)--(C) (S)--(G);
  \\foreach \\diem in {A,B,C,S,G} \\fill (\\diem) circle(1pt);
  \\foreach \\dau/\\cuoi in {S/A,S/B,S/C} \\path (\\dau)--(\\cuoi) node[midway,sloped]{$|$};
  \\foreach \\dau/\\cuoi in {A/B,C/B,A/C} \\path (\\dau)--(\\cuoi) node[midway,sloped]{$||$};
\\end{tikzpicture}

% -- Vẽ hình chóp tứ giác đều S.ABCD
\\begin{tikzpicture}[scale=1, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\bc{4} \\def\\ba{2} \\def\\h{4} \\def\\gocB{45}
  \\coordinate[label=below left:$B$] (B) at (0,0); \\coordinate[label=above right:$A$] (A) at (\\gocB:\\ba);
  \\coordinate[label=below:$C$] (C) at (\\bc,0); \\coordinate[label=right:$D$] (D) at ($(C)-(B)+(A)$);
  \\coordinate[label=below:$O$] (O) at ($(A)!.5!(C)$); \\coordinate[label=above:$S$] (S) at ($(O)+(90:\\h)$);
  \\draw (B)--(C)--(D)--(S)--cycle (S)--(C); \\draw[dashed] (C)--(A)--(D)--(B) (O)--(S)--(A)--(B);
  \\foreach \\diem in {A,B,C,D,S,O} \\fill (\\diem) circle(1pt);
  \\foreach \\dau/\\cuoi in {S/A,S/B,S/D,S/C} \\path (\\dau)--(\\cuoi) node[midway,sloped]{$|$};
  \\foreach \\dau/\\cuoi in {A/B,B/C,C/D,D/A} \\path (\\dau)--(\\cuoi) node[midway,sloped]{$||$};
  \\foreach \\mot/\\hai/\\ba in {A/B/C, B/C/D, C/D/A, D/A/B} \\draw pic[draw=black,angle radius=5pt] {right angle = \\mot--\\hai--\\ba};
\\end{tikzpicture}

%% =============== ĐỒ THỊ HÀM SỐ ===============
% -- Đồ thị hàm số bậc hai y = x^2 + 2x + 3
\\begin{tikzpicture}[line join=round, line cap=round, >=stealth, thin]
  \\tikzset{every node/.style={scale=0.9}}
  \\draw[->] (-4.1,0)--(4.1,0) node[below left] {$x$};
  \\draw[->] (0,-4.1)--(0,4.1) node[below left] {$y$};
  \\draw (0,0) node[below left] {$O$};
  \\foreach \\x/\\nx in {-3/-3, -2/-2, -1/-1, 1/1, 2/2, 3/3} \\draw[thin] (\\x,1pt)--(\\x,-1pt) node[below] {$\\nx$};
  \\foreach \\y/\\ny in {-3/-3, -2/-2, -1/-1, 1/1, 2/2, 3/3} \\draw[thin] (1pt,\\y)--(-1pt,\\y) node[left] {$\\ny$};
  \\draw[dashed,thin](-1,0)--(-1,2)--(0,2);
  \\begin{scope}
    \\clip (-4,-4) rectangle (4,4);
    \\draw[samples=200, domain=-3:3, smooth, variable=\\x] plot (\\x, {(\\x)^2 + 2*(\\x) + 3});
  \\end{scope}
\\end{tikzpicture}

% -- Đồ thị hàm phân thức y = (x+1)/(3x+2)
\\begin{tikzpicture}[scale=1, font=\\footnotesize, line join=round, line cap=round, >=stealth]
  \\def\\xmin{-4} \\def\\xmax{2} \\def\\ymin{-3} \\def\\ymax{3}
  \\draw[->] (\\xmin-0.2,0)--(\\xmax+0.2,0) node[below] {$x$};
  \\draw[->] (0,\\ymin-0.2)--(0,\\ymax+0.2) node[right] {$y$};
  \\draw (0,0) node [below left] {$O$};
  \\clip (\\xmin,\\ymin) rectangle (\\xmax,\\ymax);
  \\draw[dashed] (\\xmin,0.33)--(\\xmax,0.33);
  \\draw[dashed] (-0.67,\\ymin)--(-0.67,\\ymax);
  \\draw[smooth,samples=200,domain=\\xmin:-0.77] plot (\\x,{(\\x+1)/(3*\\x+2)});
  \\draw[smooth,samples=200,domain=-0.57:\\xmax] plot (\\x,{(\\x+1)/(3*\\x+2)});
\\end{tikzpicture}

%% =============== BẢNG BIẾN THIÊN ===============
% -- Bảng biến thiên hàm số bậc ba y = x^3 + 3x^2 - 2
\\begin{tikzpicture}
  \\tkzTabInit[nocadre,lgt=1.5,espcl=2.5,deltacl=0.7]
     {$x$/0.6,$y'$/0.6,$y$/2}
     {$-\\infty$,$-2$,$0$,$+\\infty$}
  \\tkzTabLine{,+,0,-,0,+,}
  \\tkzTabVar{-/$-\\infty$,+/$2$,-/$-2$,+/$+\\infty$}
\\end{tikzpicture}

%% =============== TRỤC SỐ / XÉT DẤU ===============
\\begin{tikzpicture}[line join=round, line cap=round, >=stealth, thick]
  \\fill[pattern=north east lines](-4,-0.15) rectangle (-1.5,0.15);
  \\draw[->] (-4,0)--(4,0);
  \\draw (-1.5,0) node {$\\big($} (-1.5,0) node[below=6pt] {$a$};
  \\draw (0.75,0) node {$\\big]$} (0.75,0) node[below=6pt] {$b$};
\\end{tikzpicture}

%% =============== BIỂU ĐỒ (cột, tròn, ...) ===============
% -- Vẽ biểu đồ cột màu magenta với 3 cột
\\begin{tikzpicture}[scale=.5,font=\\scriptsize]
  \\draw (0,0)--(16,0) node[below, midway, sloped]{$x$};
  \\draw (0,0)--(0,5.5) node[left, midway, sloped]{$n$};
  \\foreach \\x/\\n[count=\\i from 1] in {10/3,12/4,15/5}{
    \\draw[line width=4mm,magenta] (\\i,0) node[below, black]{$\\x$} --++(0,\\n);
    \\draw[dashed] (\\i,\\n)--(0,\\n) node[left]{$\\n$};
  }
\\end{tikzpicture}

% -- Vẽ biểu đồ tròn
\\begin{tikzpicture}
  \\def\\r{2} \\def\\gocxp{90}
  \\coordinate (A) at (90:\\r);
  \\foreach \\val/\\freq/\\col/\\pattern[count=\\i from 0] 
      in {Giỏi/20/red/horizontal lines, Khá/35/green/north east lines, Đạt/40/blue/grid, Chưa đạt/5/magenta/bricks}{
    \\pgfmathsetmacro\\gockt{-(\\freq*3.6 - \\gocxp)}
    \\pgfmathsetmacro\\gocnode{\\gocxp + \\gockt}
    \\draw[gray!50,pattern=\\pattern,pattern color=\\col] (0,0)--(A) arc(\\gocxp:\\gockt:\\r) coordinate(A)--cycle;
    \\fill[pattern=\\pattern,pattern color=\\col] (\\r+1,\\r-0.75*\\i) --++(0:1.25) --++(-90:.5) node[pos=.5,right,black]{\\val} --++(180:1.25)--cycle;
    \\path ($(0,0)+(\\gocnode/2:1.1)$) node[fill=white,inner sep=0pt,circle] {\\color{black} $\\freq\\%$};
    \\global\\let\\gocxp=\\gockt
  }
\\end{tikzpicture}

2. Vẽ góc và ký hiệu góc:
   - Góc vuông: \\draw pic[draw, angle radius=2mm, angle eccentricity=1.5]{right angle = A--B--C};
   - Góc có số đo: \\draw pic[draw, angle radius=2mm, angle eccentricity=2.5,"$30^\\circ$"]{angle = A--C--B};

3. Hiển thị độ dài cạnh: \\path (A)--(B) node[midway, sloped, above]{$3$};
4. Ký hiệu đánh dấu cạnh: \\path (A)--(B) node[sloped, midway]{\\tiny |};
5. Gán nhãn điểm: \\foreach \\x/\\y in {B/180, A/90, C/0}{ \\fill (\\x) circle(1pt) ($(\\x)+(\\y:0.3cm)$) node{$\\x$}; }
6. Giao điểm: \\coordinate (A) at (intersection of B--C and E--D);
7. Gán điểm theo tọa độ: \\coordinate (A) at (góc quay:khoảng cách R);

%%%%%%%%% VẼ TAM GIÁC NGOẠI TIẾP ĐƯỜNG TRÒN%%%%%
\\def\\canhAB{4};\\def\\canhBC{6};\\def\\gocABC{50};
\\coordinate (B) at (0,0);
\\coordinate (A) at ($(B)+(\\gocABC:\\canhAB)$);
\\coordinate (C) at ($(B)+(0:\\canhBC)$);
\\path let \\p1=($(B)-(A)$), \\p2=($(B)-(C)$), \\n1={veclen(\\x1,\\y1)},\\n2={veclen(\\x2,\\y2)} in ($(A)!scalar(\\n1/(\\n1+\\n2))!(C)$) coordinate (CDPGABC);
\\path let \\p1=($(C)-(A)$), \\p2=($(C)-(B)$), \\n1={veclen(\\x1,\\y1)},\\n2={veclen(\\x2,\\y2)} in ($(A)!scalar(\\n1/(\\n1+\\n2))!(B)$) coordinate (CDPGACB);
\\coordinate (O) at (intersection of B--CDPGABC and C--CDPGACB);
\\draw (A)--(B)--(C)--cycle;
\\draw let \\p1=($(O)-($(A)!(O)!(B)$)$) in (O) circle({veclen(\\x1,\\y1)});
\\foreach \\x/\\y in {O/220,A/90, B/180, C/0}{\\fill (\\x) circle(1pt) ($(\\x)+(\\y:0.3cm)$) node{$\\x$};}

%%%%%%%Kiểu tô pattern%%%%%%%%%
pattern = north east lines
pattern = grid
pattern = bricks
pattern = checkerboard
pattern = fivepointed stars
pattern = dots
`;

const STRUCTURED_LATEX_TEMPLATE = `
\\chapter{TIÊU ĐỀ CHƯƠNG} %VIẾT HOA
\\section{TIÊU ĐỀ BÀI HỌC} %VIẾT HOA
\\subsection{TIÊU ĐỀ NHỎ}

\\begin{dn}
	Nội dung định nghĩa
\\end{dn}

\\begin{note}
	Nội dung chú ý
\\end{note}

%%==== Ví dụ 1
\\begin{vd}
Nội dung ví dụ 1
\\loigiai{
   % Lời giải
}
\\end{vd}

%%==== Luyện tập 1
\\begin{ltap}
	Nội dung luyện tập 1
	\\loigiai{
		% Lời giải
	}
\\end{ltap}

\\begin{nx}
	Nội dung nhận xét
\\end{nx}

%%==== Vận dụng
\\begin{vandung}
	Nội dung vận dụng
	\\loigiai{
		% Lời giải
	}
\\end{vandung}

\\subsubsection{BÀI TẬP}
%%=====Bài 1
\\begin{bt}
\\begin{enumerate} % Nếu có câu hỏi phụ
\\item ý 1
\\item ý 2
\\end{enumerate}
\\loigiai{
   % Lời giải
}
\\end{bt}

%%=====Bài 2
\\begin{bt}
\\loigiai{
}
\\end{bt}

% ... (Các bài tập tiếp theo)

% CẤU TRÚC TRẮC NGHIỆM
\\begin{ex}
	nội dung câu hỏi
	\\choice
	{đap an A}
	{đap an B}
	{đap an C}
	{đap an D}
    \\loigiai{
        % Lời giải chi tiết
    }
\\end{ex}
`;

/**
 * Robust wrapper to handle API calls with fallback mechanism.
 */
const generateWithFallback = async (
    params: {
        contents: any,
        config?: any,
        systemInstruction?: string
    }
): Promise<string> => {
    const ai = getClient();
    
    // Attempt 1: Gemini 3.1 Pro Preview (Best quality)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: params.contents,
            config: {
                ...params.config,
                systemInstruction: params.systemInstruction
            }
        });
        return response.text || "";
    } catch (error: any) {
        const errorMessage = String(error?.message || error);
        
        // Check for Quota (429) or Server Overload (503) or generic failures
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("503") || errorMessage.includes("Overloaded")) {
            console.warn("Gemini 3.1 Pro quota exceeded or overloaded. Falling back to Gemini 2.5 Flash.");
            
            // Remove 'thinkingConfig' as it might not be compatible/optimal for standard Flash fallback in the same way
            const { thinkingConfig, ...fallbackConfig } = params.config || {};

            // Attempt 2: Gemini 2.5 Flash (High availability)
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: params.contents,
                    config: {
                        ...fallbackConfig,
                        systemInstruction: params.systemInstruction
                    }
                });
                return response.text || "% Generated with Gemini 2.5 Flash (Fallback)";
            } catch (fallbackError) {
                throw fallbackError; // If fallback also fails, throw error
            }
        }
        
        throw error; // If it's another error (e.g., Invalid API Key), throw it
    }
};

/**
 * Generates TikZ code from an image OR text requirements using the provided reference style.
 */
export const generateTikZ = async (imageFile: File | null, requirements: string): Promise<string> => {
  const parts: any[] = [];
  
  if (imageFile) {
    const imagePart = await fileToGenerativePart(imageFile);
    parts.push(imagePart);
  }

  // Construct Prompt based on inputs
  let taskDescription = "";
  if (imageFile && requirements) {
      taskDescription = "Task: Analyze the uploaded image. Then, generate TikZ code to reproduce it BUT apply the following specific modifications/requirements from the user: " + requirements;
  } else if (imageFile) {
      taskDescription = "Task: Analyze the uploaded image and generate the complete LaTeX TikZ code to reproduce it exactly.";
  } else if (requirements) {
      taskDescription = "Task: Generate a TikZ figure based solely on the following geometry problem or description: " + requirements;
  } else {
      throw new Error("No input provided (image or text).");
  }

  const prompt = `
    You are an expert in LaTeX and TikZ. 
    ${taskDescription}
    
    CRITICAL REQUIREMENT:
    You MUST strictly follow the coding style, syntax patterns, and library usage defined in the "REFERENCE CODE" below to draw quickly and accurately.
    Use the specific commands like \\coordinate, \\path let ..., \\circumcenter, intersection of, etc., as shown in the reference if applicable.
    
    === REFERENCE CODE START (USE THESE PATTERNS) ===
    ${REFERENCE_TIKZ_CODE}
    === REFERENCE CODE END ===

    Output Rules:
    1. Return ONLY the raw LaTeX code inside \\begin{tikzpicture} ... \\end{tikzpicture}.
    2. Do not enclose it in markdown code blocks. Just the code.
    3. Ensure the code compiles with standard libraries (calc, angles, quotes, intersections, etc.).
    4. For labels, use the \\foreach loop style as shown in the reference.
    5. CRITICAL: DO NOT TRUNCATE THE CODE. You must output the entire, complete TikZ code from \\begin{tikzpicture} to \\end{tikzpicture}. Do not use comments like "% ... rest of the code" to skip parts.
    6. OPTIMIZE FOR LENGTH: Use \\foreach loops for repetitive elements (points, labels, lines) to keep the code concise and avoid hitting output limits.
    7. AVOID POINT-BY-POINT DRAWING: If the image contains curves, graphs, or complex shapes, DO NOT draw them point-by-point with hundreds of coordinates. Use mathematical functions (e.g., \\draw plot) or simplified bezier curves. The code MUST be concise enough to not be truncated.
  `;
  
  parts.push({ text: prompt });

  const config: any = {
    maxOutputTokens: 8192,
  };

  const systemInstruction = "You are an expert LaTeX and TikZ developer. You must output the COMPLETE, un-truncated TikZ code. Never stop generating halfway. Do not include any explanations, only the raw LaTeX code. If the code is long, prioritize completing the \\end{tikzpicture} over adding unnecessary details. DO NOT use point-by-point drawing for curves.";

  try {
    let text = await generateWithFallback({
        contents: { parts: parts },
        config: config,
        systemInstruction: systemInstruction
    });
    
    if (text) {
      // Strip markdown code blocks if the model still outputs them
      text = text.replace(/^```latex\n?/m, '').replace(/^```tikz\n?/m, '').replace(/^```\n?/m, '').replace(/```$/m, '').trim();
    }
    
    return text || "% No TikZ generated.";
  } catch (error) {
    console.error("Gemini TikZ Gen Error:", error);
    return `% Error generating TikZ. \n% Details: ${error instanceof Error ? error.message : String(error)}`;
  }
};

/**
 * Converts an image to structured LaTeX matching the user's specific template.
 * @param file The image file to convert
 * @param includeSolutions If true, AI will solve the problems. If false, it will only transcribe.
 */
export const convertImageToStructuredLatex = async (file: File, includeSolutions: boolean = false): Promise<string> => {
    const parts: any[] = [];
    const imagePart = await fileToGenerativePart(file);
    parts.push(imagePart);
    
    const solutionRule = includeSolutions 
        ? "8. SOLVE the problems. Inside \\loigiai{}, provide a detailed step-by-step solution. For geometry or graphs, you MUST generate TikZ code inside \\loigiai{}."
        : "8. DO NOT SOLVE. Leave \\loigiai{} empty. Only transcribe text found in the image. Do not create new solutions.";

    const prompt = `
        Task: OCR and Convert the content of this image/document (Image or PDF) into LaTeX code.
        
        CRITICAL FORMATTING REQUIREMENT:
        You MUST organize the output strictly following the structure and environments below.
        Identify the content type (Definition, Example, Exercise, Multiple Choice, etc.) and wrap it in the correct environment tag.

        === REQUIRED STRUCTURE TEMPLATE (STRICTLY FOLLOW) ===
        ${STRUCTURED_LATEX_TEMPLATE}
        === END TEMPLATE ===

        Rules:
        1. If you see a chapter/lesson title, use \\chapter{} and \\section{}.
        2. If you see a Definition, use \\begin{dn}...\\end{dn}.
        3. If you see an Example, use \\begin{vd}...\\end{vd}.
        4. If you see Exercises (Essays), use \\begin{bt}...\\end{bt}.
        5. If you see Multiple Choice, use \\begin{ex}...\\choice...\\end{ex}.
        6. Transcribe ALL math formulas correctly using $...$ for inline and $$...$$ or \\begin{aligned} for display.
        7. For Geometry figures, if doing solutions, generate TikZ. If not doing solutions, leave a comment like % [Hinh ve].
        ${solutionRule}
        9. Output ONLY the LaTeX code.
        
        10. **LIST FORMATTING (STRICT - APPLIES EVERYWHERE INCLUDING INSIDE \\loigiai)**:
            - **Numbered Lists** (1, 2, 3... or a, b, c...): YOU MUST USE the \`enumerate\` environment.
            - **Bullet Points** (-, •, +...): YOU MUST USE the \`itemize\` environment.
            
            - **LOGICAL DEDUCTIONS (Proof/Implies)**:
              When proving conditions (e.g., triangle similarity, congruence) where multiple conditions lead to a conclusion, YOU MUST USE THIS EXACT FORMAT:
              
              Xét [Subject] ta có
              $\\heva{
              & [Condition 1] \\\\
              & [Condition 2] \\\\
              & [Condition 3]
              }$\\\\
              Suy ra [Conclusion]
              
              (Note: Always start lines inside \\heva with & for alignment).
    `;
    
    parts.push({ text: prompt });

    // Enable thinking if we need to solve complex problems
    let config: any = {
        maxOutputTokens: 8192,
    };
    if (includeSolutions) {
        config.thinkingConfig = { thinkingBudget: 2048 };
    }

    try {
        const text = await generateWithFallback({
            contents: { parts: parts },
            config: config 
        });
        return text || "% No content converted.";
    } catch (error) {
        console.error("Gemini Conversion Error:", error);
        return `% Error converting document. \n% Details: ${error instanceof Error ? error.message : String(error)}`;
    }
};

/**
 * Selects questions based on user criteria using Gemini context window capabilities.
 */
export const generateExamContent = async (
  mcqs: Question[],
  essays: Question[],
  config: ExamConfig
): Promise<string> => {
  const { mcqCount, essayCount, requirements, includeHeader, examVariations, includeSolutions } = config;

  const systemInstruction = `
    You are an expert Math Teacher assisting in creating a LaTeX exam paper.
    Your task is to format the provided selected questions into a complete exam paper.
    
    Output Format:
    Return ONLY the final raw LaTeX code for the questions.
    DO NOT include \\documentclass, \\begin{document}, or \\end{document}.
    The output should be ready to insert into a .tex document body.
  `;

  let solutionInstruction = "";
  if (includeSolutions) {
    solutionInstruction = `
    6. INCLUDE SOLUTIONS: YES.
       - **IMPORTANT**: Embed the solution DIRECTLY INSIDE the question environment.
       
       **MATH FORMATTING STANDARDS (STRICT):**
       - **Line Breaks**: Use double backslash '\\\\' at the end of lines to force a line break in the text.
         Example: Ta có dòng 1\\\\ Ta có dòng 2
         
       - **Inline Math**: ALL numbers, variables, points, and units MUST be enclosed in '$'. 
         Correct: $A$, $ABC$, $3$ cm, $x = 1$, $\\triangle ABC$.
         Incorrect: A, ABC, 3 cm, x = 1.
       
       - **Logical Groups (Conditions)**: Use the command \\heva{ ... } inside '$'.
         Example: $\\heva{ x+y=2 \\\\ x-y=0 }$
         
       - **Equations/Alignment**: Use $\\begin{aligned}[t] ... \\end{aligned}$ for systems of equations or multi-line equations.
         Example: $\\begin{aligned}[t] x &= 2 \\\\ y &= 3 \\end{aligned}$

       - **LISTS (INSIDE \\loigiai)**:
         - **Numbered Lists**: MUST use \\begin{enumerate} \\item ... \\end{enumerate}.
         - **Bullet Points**: MUST use \\begin{itemize} \\item ... \\end{itemize}.
         - **Prohibited**: Do not use manual numbers or symbols for lists inside solutions.
       
       - **LOGICAL DEDUCTIONS (Proof/Implies)**:
         When presenting a proof where multiple conditions lead to a conclusion (e.g., Triangle Comparision, Parallel lines), use this EXACT structure:
         
         Xét [Subject] ta có\\\\
         $\\heva{
            & [Condition 1] \\\\
            & [Condition 2] \\\\
            & [Condition 3]
         }$\\\\
         Suy ra [Conclusion]
       
       **DIAGRAMS IN SOLUTIONS (IMPORTANT):**
       - If the problem involves Geometry (Hình học) or Graphs (Đồ thị), you MUST generate a TikZ diagram inside the solution.
       - Structure inside \\loigiai{}:
         \\loigiai{
           \\begin{center}
             \\begin{tikzpicture}
               ... [Generate appropriate TikZ code here] ...
             \\end{tikzpicture}
           \\end{center}
           [Solution Text Here - strictly following Math Formatting Standards]
         }

       A. **For 'bt' (Essay) Questions**:
          - Follow this exact structure:
            \\begin{bt}
              [Question content]
              [Keep existing \\begin{enumerate} for sub-questions if present]
              \\loigiai{
                [OPTIONAL: Insert TikZ diagram here if Geometry/Graph]
                [Detailed step-by-step solution]
                [CRITICAL: Use \\\\ to separate lines/steps in the solution text]
                [If question has sub-questions, use \\begin{enumerate} \\item ... \\end{enumerate} inside \\loigiai to match]
              }
            \\end{bt}
            
       B. **For 'ex' (Multiple Choice) Questions**:
          - Solve the question to determine the correct answer.
          - **Mark the correct answer**: Insert \\True inside the \\choice block for the correct option.
            Example: 
            \\choice 
            {\\True Correct Answer}
            {Wrong Answer}
            {Wrong Answer}
            {Wrong Answer}
          - **Explanation**: Add a \\loigiai{...} block before \\end{ex}.
          - Inside \\loigiai{}, include TikZ diagram (if needed) followed by text (using \\\\ for breaks).
    `;
  } else {
    solutionInstruction = "6. INCLUDE SOLUTIONS: NO. Do not generate \\loigiai{} commands. Keep the original content only (do not add \\True).";
  }

  const variations = examVariations || 1;
  let finalLatex = "";

  if (includeHeader) {
    finalLatex += `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{tikz, tkz-tab, pgfplots}
\\usepackage{mathrsfs}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{calc, angles, quotes, intersections, patterns, 3d, shapes, positioning, shadows, arrows.meta}
\\newcommand{\\heva}[1]{\\left\\{\\begin{aligned}#1\\end{aligned}\\right.}
\\newcommand{\\hoac}[1]{\\left[\\begin{aligned}#1\\end{aligned}\\right.}
\\tikzset{>=stealth, line join=round, line cap=round, font=\\footnotesize, thick}
\\usepackage[left=2cm,right=2cm,top=2cm,bottom=2cm]{geometry}
\\begin{document}

`;
  }

  // Helper to shuffle array
  const shuffleArray = <T>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  for (let i = 1; i <= variations; i++) {
    // Randomly select the exact number of questions requested
    const selectedMcqs = shuffleArray(mcqs).slice(0, mcqCount);
    const selectedEssays = shuffleArray(essays).slice(0, essayCount);

    const mcqContext = selectedMcqs.map((q, idx) => `Câu ${idx + 1}:\n${q.content}`).join('\n\n');
    const essayContext = selectedEssays.map((q, idx) => `Bài ${idx + 1}:\n${q.content}`).join('\n\n');

    const userPrompt = `
      Here are the specific questions selected for this exam:
      
      === PHẦN I: TRẮC NGHIỆM (${selectedMcqs.length} câu) ===
      ${mcqContext}
      
      === PHẦN II: TỰ LUẬN (${selectedEssays.length} câu) ===
      ${essayContext}
      
      === USER REQUIREMENTS ===
      1. You MUST include ALL the questions provided above in the exam. Do not skip any question and do not add any extra questions.
      2. Custom Instructions: ${requirements || "Format the test clearly."}
      3. This is EXAM VERSION ${i} of ${variations}.
      4. Start the output with a bold title: \\begin{center} \\Large \\textbf{ĐỀ SỐ ${i}} \\end{center}
      ${solutionInstruction}
      
      Instructions:
      - Preserve the math equations and existing TikZ code exactly.
      - Standardize the 'bt' and 'ex' environment structures as requested.
      - Group the output into "\\textbf{Phần I: Trắc nghiệm}" and "\\textbf{Phần II: Tự luận}".
    `;

    try {
      const text = await generateWithFallback({
          contents: userPrompt,
          config: { maxOutputTokens: 8192 },
          systemInstruction: systemInstruction
      });
      finalLatex += text || "% No content generated for this version.";
    } catch (error) {
      console.error(`Gemini Generation Error for version ${i}:`, error);
      finalLatex += `% Error generating exam version ${i} via AI. \n% Details: ${error instanceof Error ? error.message : String(error)}`;
    }

    if (i < variations) {
      finalLatex += '\n\n\\newpage\n\n';
    }
  }

  if (includeHeader) {
    finalLatex += `\n\n\\end{document}`;
  }

  return finalLatex;
};

/**
 * Solves a single specific problem input by the user.
 */
export const solveSpecificProblem = async (problemText: string): Promise<string> => {
    const systemInstruction = `
        You are an elite Math Teacher and LaTeX expert.
        Your task is to solve the math problem provided by the user and format it in LaTeX.

        FORMATTING RULES:
        1. Wrap the entire output in a \\begin{bt} ... \\end{bt} environment.
        2. Inside the environment, place the problem text first.
        3. Follow with the solution inside a \\loigiai{ ... } command.
        
        **MATH FORMATTING STANDARDS (CRITICAL):**
        1. **Text vs Math**:
           - Use normal text for Vietnamese words (Xét, ta có, suy ra, vậy...).
           - **STRICTLY** wrap ALL numbers, variables, points, and units in '$'.
             CORRECT: $A$, $ABC$, $3$ cm, $x$, $y$.
             INCORRECT: A, ABC, 3 cm, x, y.
        
        2. **Line Breaks**: 
           - Use '\\\\' to separate lines in the solution text.
        
        3. **Logical Structures**:
           - Use $\\heva{ ... }$ for systems of conditions.
           - Use $\\begin{aligned}[t] ... \\end{aligned}$ for multi-line equations.
           
        4. **Lists and Enumerations (Especially inside \\loigiai)**:
           - **Numbered Lists** (1, 2, 3...): MUST use \\begin{enumerate} \\item ... \\end{enumerate}.
           - **Bullet Points** (-, •): MUST use \\begin{itemize} \\item ... \\end{itemize}.
           - **NEVER** use manual numbering or bullet characters in plain text.
        
        5. **Specific Patterns**:
           - **LOGICAL DEDUCTIONS (General Proof Pattern)**:
             When proving conditions (e.g., triangle similarity, congruence, or logic implications), use this EXACT structure:
             
             Xét [Subject] ta có\\\\
             $\\heva{
                & [Condition 1] \\\\
                & [Condition 2] \\\\
                & [Condition 3]
             }$\\\\
             Suy ra [Conclusion]
             
             (Use & at the start of lines inside \\heva).

        CRITICAL \\loigiai STRUCTURE:
        The \\loigiai block MUST follow this exact structure, especially for Geometry or Graph problems:
        
        \\loigiai{
            \\begin{center}
                \\begin{tikzpicture} 
                    ... [Generate precise TikZ code here for the problem] ... 
                \\end{tikzpicture}
            \\end{center}
            [Detailed Step-by-Step Solution text starts here]
            [Use \\\\ to separate every line or logical step]
        }

        - If the problem is Algebra/Arithmetic and absolutely NO diagram is needed, you may omit the center/tikzpicture block, but still use \\\\ for line breaks.
        - However, if there is ANY geometric shape, function graph, or visual element, you MUST generate the TikZ code.
    `;

    try {
        const text = await generateWithFallback({
            contents: `Problem to solve: ${problemText}`,
            config: {
                maxOutputTokens: 8192,
                thinkingConfig: { thinkingBudget: 4096 }
            },
            systemInstruction: systemInstruction
        });

        return text || "% Could not generate solution.";
    } catch (error) {
        console.error("Gemini Solver Error:", error);
        return `% Error solving problem. \n% Details: ${error instanceof Error ? error.message : String(error)}`;
    }
};