/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question } from './types';

export const EXAM_QUESTIONS: Question[] = [
  // --- Single Choice Questions ---
  {
    id: 'choice_1',
    type: 'choice',
    number: 1,
    questionText: '关于单链表、双链表和循环链表，下列说法正确的是（ ）。',
    options: {
      A: '在单链表中，若已知任意结点的指针，则可以在 O(1) 时间内删除该结点。',
      B: '循环链表中一定不存在空指针。',
      C: '在循环双链表中，尾结点的 next 指针一定为 nullptr 。',
      D: '在带头结点的循环单链表中，判定链表是否为空只需判断头结点的 next 是否指向自身。'
    },
    correctAnswer: 'D',
    score: 2,
    knowledgePoints: ['单链表、双链表、循环链表'],
    explanation: 'A错误，单链表删除某节点通常需要修改其前驱结点的 next 指针，即使已知该结点的指针，由于不能直接拿到它的前驱，仍然需要从头遍历到该节点以定位前驱节点，因此普通删除时间复杂度为 $O(n)$。虽然有复制下一个节点内容到当前节点并删除下一个节点的 $O(1)$ 技巧，但这一技巧对删除尾节点（尾节点没有后继）无效。\n\nB错误，标准的循环链表确实不存在空指针，但循环链表的异常或非标准实现中可以允许一些分支存在空，或者某些特定扩展形态。最无争议中，D是最标准的结论。\n\nC错误，循环双链表是循环结构，尾结点的 next 指针指向头结点而不是 nullptr。\n\nD正确，在带头结点的循环单链表中，当链表为空时，头结点的 next 就会指回它自己本身。所以通过判断 `head->next == head` 来判定链表是否为空是完全正确且无争议的。'
  },
  {
    id: 'choice_2',
    type: 'choice',
    number: 2,
    questionText: '双向循环链表中要在结点 p 之前插入新结点 s （均非空），以下指针操作正确的是（ ）。',
    options: {
      A: 's -> next = p;\np -> prev = s;\np -> next = s;\ns -> prev = p;',
      B: 's -> prev = p;\ns -> next = p -> next;\np -> next -> prev = s;\np -> next = s;',
      C: 's -> next = p;\ns -> prev = p -> prev;\np -> prev -> next = s;\np -> prev = s;',
      D: 's -> next = p;\ns -> prev = nullptr;\np -> prev = s;'
    },
    correctAnswer: 'C',
    score: 2,
    knowledgePoints: ['单链表、双链表、循环链表'],
    explanation: '在双向循环链表中，若需要在结点 p 之前插入新结点 s（即 s 成为 p 的前驱，而 s 的前驱成为原本 p 的前驱，s 的后继为 p）：\n\n- 第一步：`s->next = p;` (将 s 的后继指向 p)\n- 第二步：`s->prev = p->prev;` (将 s 的前驱指向原 p 的前驱结点)\n- 第三步：`p->prev->next = s;` (将原 p 前驱结点的后继指向新插入的 s)\n- 第四步：`p->prev = s;` (将 p 的前驱修改为 s，完成合围)\n\n这四个修改顺序可以安全插入且不丢失任何已有链接指针。选项C步骤正确且完美不丢失指针，故选 C。'
  },
  {
    id: 'choice_3',
    type: 'choice',
    number: 3,
    questionText: '下面函数用“哑结点”统一处理删除单向链表中的头结点与中间结点。横线处应填（ ）。',
    codeBlock: `struct Node{
    int val;
    Node* next;
    Node(int v):val(v),next(nullptr){}
};
Node* eraseAll(Node* head, int x){
    Node dummy(0);
    dummy.next = head;
    Node* cur = &dummy;
    while(cur->next){
        if(cur->next->val == x){
            Node* del = cur->next;
            ______________________
            delete del;
        }else cur = cur->next;
    }
    return dummy.next;
}`,
    options: {
      A: 'cur = cur->next;',
      B: 'cur->next = del->next;',
      C: 'del->next = cur->next;',
      D: 'cur->next = nullptr;'
    },
    correctAnswer: 'B',
    score: 2,
    knowledgePoints: ['单链表、双链表、循环链表'],
    explanation: '在给定的 `eraseAll` 循环中，`cur` 是用来遍历链表的前序扫描指针。当发现 `cur->next` (即下一个结点，也就是 `del`) 的值等于要删除的元素 `x` 时：\n\n我们需要将 `cur->next` 越过待删除项 `del`，指向 `del->next`。这样在把 `del` 空间删除释放后，链表依然能保持正确的首尾连接而不会发生断链危机。\n\n因此，空格线处必须填：`cur->next = del->next;`。这样修改后，下一轮循环可以直接判断刚才合并过来的新后继，因此此时不移动 `cur = cur->next`。答案选 B。'
  },
  {
    id: 'choice_4',
    type: 'choice',
    number: 4,
    questionText: '对如下代码实现的欧几里得算法（辗转相除法），执行 gcd(48, 18) 得到的调用序列为（ ）。',
    codeBlock: `int gcd(int a, int b) {
    return b == 0 ? a : gcd(b, a % b);
}`,
    options: {
      A: 'gcd(48,18) -> gcd(18,12) -> gcd(12,6) -> gcd(6,0)',
      B: 'gcd(48,18) -> gcd(30,18) -> gcd(12,18)',
      C: 'gcd(48,18) -> gcd(18,30) -> gcd(30,6)',
      D: 'gcd(48,18) -> gcd(12,18) -> gcd(6,12)'
    },
    correctAnswer: 'A',
    score: 2,
    knowledgePoints: ['辗转相除法 (也称欧几里得算法)', '递归'],
    explanation: '根据代码和输入调用顺序进行追踪演变：\n\n- 第一步：调用 `gcd(48, 18)`。因为 $18 \\ne 0$，所以进入三目运算符后方，递归调用 `gcd(18, 48 % 18)`。由于 $48 \\pmod{18} = 12$，所以调用变为 `gcd(18, 12)`。\n- 第二步：调用 `gcd(18, 12)`。由于 $12 \\ne 0$，递归调用 `gcd(12, 18 % 12)`，即 `gcd(12, 6)`。\n- 第三步：调用 `gcd(12, 6)`。由于 $6 \\ne 0$，递归调用 `gcd(6, 12 % 6)`，即 `gcd(6, 0)`。\n- 第四步：调用 `gcd(6, 0)`。此时因为 $b = 0$，触发终止条件满足 `b == 0`，返回 `a` 即 6。\n\n整个调用序列链为 `gcd(48,18) -> gcd(18,12) -> gcd(12,6) -> gcd(6,0)`。所以答案选择 A。'
  },
  {
    id: 'choice_5',
    type: 'choice',
    number: 5,
    questionText: '下面代码实现了欧拉（线性）筛，横线处应填写（ ）。',
    codeBlock: `vector<int> euler_sieve(int n) {
    vector<bool> is_composite(n + 1, false);
    vector<int> primes;
    for (int i = 2; i <= n; i++) {
        if (!is_composite[i])
            primes.push_back(i);
        for (int j = 0; __________________________ && (long long)i * primes[j] <= n; j++) {
            is_composite[i * primes[j]] = true;
            if (i % primes[j] == 0)
                break;
        }
    }
    return primes;
}`,
    options: {
      A: 'j <= n',
      B: 'j < sqrt(n)',
      C: 'j < primes.size()',
      D: 'j < i'
    },
    correctAnswer: 'C',
    score: 2,
    knowledgePoints: ['素数表的埃氏筛法和线性筛法'],
    explanation: '欧拉筛选（也就是线性筛选）在内层循环中，通过遍历已经保存下来的所有已知质数（即存放于 `primes` 数组里的质数）来进行倍数标记。\n\n因为要在内层循环中以 `primes[j]` 为下标取出当前对应的质数，而 `j` 是从 `0` 递增的，所以为了防止数组访问越界，且将所有当前收集到的质数遍历完整，其上限必定是已经求出的 `primes` 的大小，即：`j < primes.size()`。\n\n因此填入选项 C。'
  },
  {
    id: 'choice_6',
    type: 'choice',
    number: 6,
    questionText: '埃氏筛中将内层循环从 j = i*i 开始而不是 j = 2*i 的主要原因是（ ）。',
    codeBlock: `vector<int> eratosthenes_sieve(int n) {
    vector<bool> is_composite(n + 1, false);
    vector<int> primes;
    for (int i = 2; i <= n; i++) {
        if (is_composite[i]) continue;
        primes.push_back(i);
        for (long long j = (long long)i * i; j <= n; j += i)
            is_composite[j] = true;
    }
    return primes;
}`,
    options: {
      A: '因为 2*i 一定不是合数',
      B: 'i*i 一定是质数',
      C: '小于 i*i 的 i 的倍数已被更小质因子筛过',
      D: '这样可以把时间复杂度降为 O(n)'
    },
    correctAnswer: 'C',
    score: 2,
    knowledgePoints: ['素数表的埃氏筛法和线性筛法'],
    explanation: '在埃氏筛（Eratosthenes 筛）中，当我们准备筛去质数 $i$ 的倍数时：\n对于那些小于 $i^2$ 且大于 $i$ 的数，例如 $2i, 3i, 4i, \\dots, (i-1)i$，这些数必定存在一个小于 $i$ 的质因子。\n\n因为它们的另一个乘积乘数是小于 $i$ 的。这就意味着，在我们的主循环遍历到那个更小的质因子时，早已经把这些数判定并筛过了为合数了。所以从 $i \\times i$ 开始筛，可以最大程度避免重复标记，提升算法的时间效能。所以本题选 C。'
  },
  {
    id: 'choice_7',
    type: 'choice',
    number: 7,
    questionText: '下面程序的运行结果为（ ）。',
    codeBlock: `bool check(int n, int a[], int k, int dist) {
    int cnt = 1;
    int last = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] - last >= dist) {
            cnt++;
            last = a[i];
        }
    }
    return cnt >= k;
}
int solve(int n, int a[], int k) {
    std::sort(a, a + n);
    int l = 0;
    int r = a[n - 1] - a[0];
    while (l < r) {
        int mid = (l + r + 1) / 2;
        if (check(n, a, k, mid))
            l = mid;
        else
            r = mid - 1;
    }
    return l;
}
int main() {
    int a[] = {1, 2, 8, 4, 9};
    int n = 5;
    int k = 3;
    std::cout << solve(n, a, k) << std::endl;
    return 0;
}`,
    options: {
      A: '2',
      B: '3',
      C: '4',
      D: '5'
    },
    correctAnswer: 'B',
    score: 2,
    knowledgePoints: ['二分查找/二分答案 (也称二分枚举法)', '贪心算法'],
    explanation: '该程序是一个标准的“最大化最小值”的二分查找算法（俗称丢牛问题模板）。\n\n1. 首先对输入数组 `a` 升序排序：得到 `{1, 2, 4, 8, 9}`，我们要从中挑选 `k = 3` 个元素，使它们之间相互的最小距离尽可能大。\n2. 我们二分枚举可能的最小距离 `dist`，并利用贪心检测 `check(n, a, k, dist)`，看能不能保留不少于 3 个间距至少为 `dist` 的数：\n   - 如果 `dist = 3`：选 `1`。下一个要 $\\ge 1+3=4$，选 `4`。再下一个要 $\\ge 4+3=7$，选 `8`。一共在 `{1, 4, 8}` 选出了 3 个符合的项，符合要求，返回 `true`。\n   - 如果 `dist = 4`：选 `1`。下一个要 $\\ge 5$，选 `8`。再下一个要 $\\ge 12$，无。一共挑出了 2 个，`cnt = 2 < 3`，返回 `false`。\n3. 因此可达到的最大间距为 3。程序最终输出 `3`。故选择 B。'
  },
  {
    id: 'choice_8',
    type: 'choice',
    number: 8,
    questionText: '在升序数组中查找第一个大于等于 x 的位置，下面循环中横线应填（ ）。',
    codeBlock: `int lowerBound(const vector<int>& a, int x){
    int l=0, r=a.size();
    while(l<r){
        int mid = l + (r - l)/2;
        if(a[mid] >= x) _____________;
        else l = mid + 1;
    }
    return l;
}`,
    options: {
      A: 'r = mid;',
      B: 'r = mid - 1;',
      C: 'l = mid;',
      D: 'l = mid + 1;'
    },
    correctAnswer: 'A',
    score: 2,
    knowledgePoints: ['二分查找/二分答案 (也称二分枚举法)'],
    explanation: '在标准的 `lower_bound`（寻找第一个不小于给定位元素 $x$）算法中：\n我们的寻值闭开区间是 `[l, r)`。\n在遇到 `a[mid] >= x` 满足条件时，说明 `mid` 这个位置有可能就是我们需要找的答案，或者更合理、更小的首发位置在 `mid` 的左边。\n\n因为我们在 `[l, r)` 模式工作，既然 `mid` 有可能是正确位置，所以在把右边界收缩时，必须是包含 `mid` 自身即 `r = mid`。如果写 `r = mid-1` 就会把这个合法的可能项直接割裂排除了，导致检索结论错误。\n而对于 `a[mid] < x` 的不符合项，说明答案肯定落在右边，所以让 `l = mid + 1`，故本题答案填 `r = mid;`。选 A。'
  },
  {
    id: 'choice_9',
    type: 'choice',
    number: 9,
    questionText: '关于递归函数调用，下列说法错误的是（ ）。',
    options: {
      A: '递归调用层次过深时，可能会耗尽栈空间导致栈溢出',
      B: '尾递归函数可以通过编译器优化来避免栈溢出',
      C: '所有递归函数都可以通过循环结构来改写，从而避免栈溢出',
      D: '栈溢出发生时，程序会抛出异常并可以继续执行后续代码'
    },
    correctAnswer: 'D',
    score: 2,
    knowledgePoints: ['递归'],
    explanation: 'A描述正确：函数调用通过系统栈实现，包含局部变量和返回地址，若深度过高必然导致 Stack Overflow；\nB描述正确：各大现代编译器（如 GCC/Clang 开启 O2）对尾递归均支持做尾调用优化（TCO）改写，使其不再层层压栈而是在当前栈空间不断复用，规避栈溢出；\nC描述正确：我们可以手动依靠栈等数据结构，建立与函数调用栈等价的循环或图，来将一切递归算法重塑为非递归版本；\nD描述错误：在C++等执行环境中，栈溢出是由于在程序内存分配时物理上超出了限制，系统级别通常是直接触发段错误（Segmentation Fault / SIGSEGV）并在没有机会抛起常规可捕捉 Exception 序列的情况下强制结束进程崩溃。不可能依靠捕捉异常然后维持运行去执行后续代码。故选 D。'
  },
  {
    id: 'choice_10',
    type: 'choice',
    number: 10,
    questionText: '给定 n 根木头，第 i 根长度为 a[i] 。要切成不少于 m 段等长木段，求最大可能长度，则横线上应填写（ ）。',
    codeBlock: `const int MAXN = 100005;
long long a[MAXN];
int n, m;
bool check(long long x){
    long long cnt = 0;
    for(int i = 1; i <= n; i++){
        if(x == 0) return true;
        cnt += a[i] / x;
        if(cnt >= m) return true;
    }
    return false;
}
int main(){
    cin >> n >> m;
    long long mx = 0;
    for(int i = 1; i <= n; i++){
        cin >> a[i];
        mx = max(mx, a[i]);
    }
    long long l = 1, r = mx;
    long long ans = 0;
    while(l <= r){
        long long mid = l + (r - l) / 2;
        if(check(mid)){
            ans = mid;
            ______________________
        }else{
            ______________________
        }
    }
    cout << ans << endl;
    return 0;
}`,
    options: {
      A: 'l = mid + 1;\nr = mid - 1;',
      B: 'l = mid - 1;\nr = mid + 1;',
      C: 'l = mid + 1;\nr = mid;',
      D: 'l = mid;\nr = mid + 1;'
    },
    correctAnswer: 'A',
    score: 2,
    knowledgePoints: ['二分查找/二分答案 (也称二分枚举法)'],
    explanation: '本题属于典型的二分查找在解空间求最大可能值（最大可能宽度）的题目。\n- 当 `check(mid)` 为 `true` 时，说明当前尝试的长度 `mid` 满足切成不少于 `m` 段的要求，既然还可以满足，那我们就应该去争取追求更大长度的尝试可能性。因此需要把最左边边界向右挪动：即 `l = mid + 1;` 使得搜索区间定位高段部分。\n- 当 `check(mid)` 为 `false` 时，说明以当前 `mid` 切分完全切不出 `m` 桌。也就是长度订高了，需要下降收窄搜索区：即 `r = mid - 1;`。\n\n这完美对应选项 A 的代码。'
  },
  {
    id: 'choice_11',
    type: 'choice',
    number: 11,
    questionText: '下面代码用分治求“最大连续子段和”，其时间复杂度为（ ）。',
    codeBlock: `int solve(vector<int>& a, int l, int r){
    if(l == r) return a[l];
    int mid = l + (r - l) / 2;
    int left = solve(a, l, mid);
    int right = solve(a, mid + 1, r);
    int sum = 0, lmax = INT_MIN;
    for(int i = mid; i >= l; i--){
        sum += a[i];
        lmax = max(lmax, sum);
    }
    sum = 0;
    int rmax = INT_MIN;
    for(int i = mid + 1; i <= r; i++){
        sum += a[i];
        rmax = max(rmax, sum);
    }
    return max({left, right, lmax + rmax});
}`,
    options: {
      A: 'O(n^2)',
      B: 'O(n log n)',
      C: 'O(log n)',
      D: 'O(n)'
    },
    correctAnswer: 'B',
    score: 2,
    knowledgePoints: ['分治算法 (归并排序和快速排序)', '算法复杂度的估算 (含多项式、指数、对数复杂度)'],
    explanation: '这是一个依靠分治求最长连续子序列和的经典范例。\n其时间递推关系为：\n$T(n) = 2T(n/2) + O(n)$\n其中：\n- 将数组分成两等分独立递归子计算为 $2T(n/2)$；\n- 寻找横跨 `mid` 边界线的两端连续序列和，从 `mid` 分别向左右做两个单层循环，总计总用时为 $O(n)$。\n依据主定理 (Master Theorem) 判定，该递归时间复杂度即为 $O(n \\log n)$，因此选项 B 完全正确。'
  },
  {
    id: 'choice_12',
    type: 'choice',
    number: 12,
    questionText: '游戏大赛决赛，两组选手分别按得分从小到大排好队，现在要把他们合并成一个有序排行榜。\n' +
      'A组： A = {12, 35, 67, 89} ，B组： B = {20, 45, 55, 78} ，下面是归并合并函数的核心循环，横线处应排入（ ）。',
    codeBlock: `int i = 0, j = 0;
vector<int> result;
while (i < A.size() && j < B.size()) {
    if (___________________) {
        result.push_back(A[i++]);
    } else {
        result.push_back(B[j++]);
    }
}`,
    options: {
      A: 'A[i] >= B[j]',
      B: 'A[i] <= B[j]',
      C: 'i >= j',
      D: 'i <= j'
    },
    correctAnswer: 'B',
    score: 2,
    knowledgePoints: ['分治算法 (归并排序和快速排序)'],
    explanation: '归并排序里由于是要合并成从小到大的升序。当 A 区的元素 `A[i]` 小于等于 B 区的元素 `B[j]` 时，我们的合并步骤会首先将 `A[i]` 押入排档队列中，以便继续升序往后挑选。\n\n所以横线上对应的合并分支，其判定逻辑即是 `A[i] <= B[j]`，同时加个等号可以维持归并算法中著名的“稳定性”，选项 B 正确。'
  },
  {
    id: 'choice_13',
    type: 'choice',
    number: 13,
    questionText: '有 n 位同学的成绩已经从小到大排好序，现在对它执行下面这段以第一个元素为 pivot 的快速排序，请问此次排序的时间复杂度是（ ）。',
    codeBlock: `void quicksort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int pivot = a[l];
    int i = l, j = r;
    while (i < j) {
        while (i < j && a[j] >= pivot) j--;
        while (i < j && a[i] <= pivot) i++;
        if (i < j) swap(a[i], a[j]);
    }
    swap(a[l], a[i]);
    quicksort(a, l, i - 1);
    quicksort(a, i + 1, r);
}`,
    options: {
      A: 'O(n)',
      B: 'O(n log n)',
      C: 'O(n^2)',
      D: 'O(log n)'
    },
    correctAnswer: 'C',
    score: 2,
    knowledgePoints: ['分治算法 (归并排序和快速排序)', '算法复杂度的估算 (含多项式、指数、对数复杂度)'],
    explanation: '由于成绩本来就已经升序从小到大排好序，如果我们依然执行将首个元素 `a[l]` 作为排序基准点（Pivot）的快速排序算法：\n这意味着在分区 Partition 时，我们每次划分，其余的所有剩余元素都必定大于等于首元，从而全部划分在了右侧，左侧分区长度为 $0$。而下一轮依然首元是最小元，递归完全退化，每一次分区其对应长度为 0 和 $k-1$。\n所以它的递归树高度将拉长为线性高度 $O(n)$，每一层需要遍历当前元素做分区比价（合计每次均摊扫描消耗为 $O(len)$），此时总的时间成本相加即 $\\sum_{i=1}^{n} O(i) = O(n^2)$。符合最坏退化表现，故选 C。'
  },
  {
    id: 'choice_14',
    type: 'choice',
    number: 14,
    questionText: '下面关于排序算法的描述中，不正确的是( )。',
    options: {
      A: '冒泡排序和插入排序都是稳定的排序算法',
      B: '快速排序和归并排序都是不稳定的排序算法',
      C: '冒泡排序和插入排序最好时间复杂度均为 O(n)',
      D: '归并排序在最好、最坏和平均三种情况的时间复杂度均为 O(n log n)'
    },
    correctAnswer: 'B',
    score: 2,
    knowledgePoints: ['分治算法 (归并排序和快速排序)'],
    explanation: 'A描述正确：冒泡和直接插入排序只在邻层违背大小规则时才在本地做指针位置微调，可以保持原值稳定，所以是保持原地秩序的稳定算法机制；\nB描述不正确：归并排序 (Merge Sort) 是经典的，公认稳定且易于并行的稳定排序算法。而快速排序才是不稳定的。因此选项 B 里的前半句“归并排序是不稳定”错误；\nC描述正确：如果在输入集合原本就已经是有序升序情况下，精简冒泡（设布尔记录是否发生交换）和直接插入排序仅作首轮位置遍历判断之后就能瞬间完成，所以时间复杂度在最好状态是 $O(n)$；\nD描述正确：归并排序属于经典的非自适应型（Non-adaptive）分治，其工作划分行为与原数组在顺序上是否完全零乱毫无关系，始终是完美的对半开加有序归并，这也是其全方位维持 $O(n \\log n)$ 性能的原因。故选 B。'
  },
  {
    id: 'choice_15',
    type: 'choice',
    number: 15,
    questionText: '下面代码实现两个整数除法，其中被除数为一个“大整数”，用字符串表示，除数是一个小整数，用 int 表示，则横线处应该填写（ ）。',
    codeBlock: `int main(){
    string s;
    int b;
    cin >> s >> b;
    vector<int> a;
    for(char c : s){
        a.push_back(c - '0');
    }
    vector<int> c;
    long long rem = 0;
    for(int i = 0; i < a.size(); i++){
        rem = rem * 10 + a[i];
        int q = rem / b;
        c.push_back(q);
        ______________________
    }
    int pos = 0;
    while(pos < c.size() - 1 && c[pos] == 0) pos++;
    for(int i = pos; i < c.size(); i++){
        cout << c[i];
    }
    cout << endl;
    cout << rem << endl;
    return 0;
}`,
    options: {
      A: 'rem /= b;',
      B: 'rem %= b;',
      C: 'rem = b;',
      D: 'rem = q;'
    },
    correctAnswer: 'B',
    score: 2,
    knowledgePoints: ['(C++) 数组模拟高精度加法、减法、乘法、除法'],
    explanation: '这是一道经典的高精度大数除以低精度单整数的模拟算法填空。\n在高精度除法逐位推导中：\n每次把上一位除法运算遗漏下的余数 `rem` 乘 $10$，再加上当前数位 `a[i]`，作为当前的合并除数。\n在这个状态下算出当前数位的商存储进 `c.push_back(q)` 之后，余下的数值没有被除尽，必须要将其取模后的余数，安全保留并赋值给 `rem`，用来交给下一次循环拼凑高位。这就是除法的基本求模概念。\n所以横线上必须写余数更新语句：`rem %= b;`。故本题答案选 B。'
  },

  // --- Judgement Questions ---
  {
    id: 'judgement_1',
    type: 'judgement',
    number: 1,
    questionText: '有一个存储了 n 个整数的线性表，分别用数组和单链表两种方式实现。在已知下标（或结点指针）的前提下，数组的随机访问是 O(1)，而在链表中已知某结点的指针时，在该结点之后插入一个新结点的操作也是 O(1)。',
    correctAnswer: 'Y',
    score: 2,
    knowledgePoints: ['单链表、双链表、循环链表'],
    explanation: '描述正确。这是线性的经典优势代表：\n- 数组本身因为是连续的内存空间，并且保存有下标，可以通过 $Address + i \\times Size$ 计算规律在大脑任意直接寻址获取，因此是 $O(1)$ 的随机存储优势。 \n- 链表中如果已经告诉你了需要进行操作的结点指针 `curr`，对其后方追加或者插入一个新的新结点 `s`，只需执行简单的 `s->next = curr->next; curr->next = s;`，这个过程是常数步骤的，所以插入复杂度正是高效的 $O(1)$。'
  },
  {
    id: 'judgement_2',
    type: 'judgement',
    number: 2,
    questionText: '若数组 a 已按升序排列，则下面代码可以正确实现“在 a 中查找第一个大于等于 x 的元素的位置”。',
    codeBlock: `int lowerBound(vector<int>& a,int x){
    int l=0, r=a.size();
    while(l < r) {
        int mid = (l + r) / 2;
        if( a[mid] >= x) r = mid;
        else l = mid + 1;
    }
    return l;
}`,
    correctAnswer: 'Y',
    score: 2,
    knowledgePoints: ['二分查找/二分答案 (也称二分枚举法)'],
    explanation: '描述正确。这个 `lowerBound` 采用了左闭右开区间 `[l, r)` 的控制思路。\n由于 `r = a.size()`：\n- 当 `a[mid] >= x` 时，表示第一个大于等于的位置可能是 `mid` 或者本身就在其更左边方向。为了使得接续搜索不丢失 `mid` 本身，设定 `r = mid` 把下一层局限在 `[l, mid)`，这正确。\n- 当 `a[mid] < x` 时，表示首个符合条件的必然不可能在 `mid` 处及左边，因而收缩左端点推进 `l = mid + 1`，这也是正确的。\n在遇到相撞触发 `l == r` 退出时，返回的 `l` 正是最完美的正确位置索引（当找不到且所有都小于 $x$ 时正好会停留在 `a.size()`）。因此，该段逻辑正确无误。'
  },
  {
    id: 'judgement_3',
    type: 'judgement',
    number: 3,
    questionText: '快速排序只要每次都选取中间元素作为枢轴，就一定是稳定排序。',
    correctAnswer: 'N',
    score: 2,
    knowledgePoints: ['分治算法 (归并排序和快速排序)'],
    explanation: '描述错误。快速排序之所以归为典型的不稳定算法，并非仅仅因为其基准点（Pivot）选择方案不佳，而是由于其最底层也最核心的 Partition (分区划分) 的交换机制。\n在交换两侧元素时，通常必然会导致大量远距离的不相近元素进行错差式的对位呼唤，从而把拥有相等数值的项原本应在先后的次序打散打破。无论基准选择方案是中间数、最左数还是随机选择数，快速排序机制永远无法自动改变不稳定的现实。'
  },
  {
    id: 'judgement_4',
    type: 'judgement',
    number: 4,
    questionText: '若某算法满足递推式：T(n) = 2T(n/2) + O(n)，则其时间复杂度为 O(n log n)。',
    correctAnswer: 'Y',
    score: 2,
    knowledgePoints: ['算法复杂度的估算 (含多项式、指数、对数复杂度)'],
    explanation: '描述正确。这是计算机中最著名、最耳熟能详的的算法主定理计算：\n形式符合 $T(n) = aT(n/b) + f(n)$，此处 $a=2, b=2$，以及驱动代价 $f(n)=O(n^1)$。\n根据对应条件，比较 $n^{\\log_b a} = n^{\\log_2 2} = n^1$ 与 $f(n) = n^1$ 二者等阶。根据主定理 Case 2 的结论，其复杂度的准确界定即为原公式加上一层的对数增量，即常指的 $O(n^{1} \\log n) = O(n \\log n)$（代表排序如归并排序的极限空间）。'
  },
  {
    id: 'judgement_5',
    type: 'judgement',
    number: 5,
    questionText: '在一个数组中，如果两个元素 a[i] 和 a[j] 满足 i < j 且 a[i] > a[j] ，则 a[i] 和 a[j] 是一个逆序对。下面代码可以正确统计数组 a 区间 [l,r] 内的逆序对总数。',
    codeBlock: `long long cnt=0;
void merge_count(vector<int>& a, int l, int m, int r){
    int i = l, j = m + 1;
    while(i <= m && j <= r) {
        if(a[i] <= a[j]) i++;
        else {
            cnt += (m - i + 1);
            j++;
        }
    }
}`,
    correctAnswer: 'N',
    score: 2,
    knowledgePoints: ['分治算法 (归并排序和快速排序)'],
    explanation: '描述错误。尽管这部分的逆序累加分支 `cnt += (m - i + 1)` 是计算逆序对的标志性核心操作，但整段程序在逻辑上包含致命缺失：\n\n1. 这是归并在合并时累加计数的方法。我们在使用分治统计逆序对之前，每一次递归都必须真正的去完成由于归并引起的**原地合并与排序（Merge and Sort）修改**，从而使下一轮上层统计可以利用有序状态来进行线性计算。在这里没有使用辅助数组去排序并覆盖写回原 `a` 数组！\n2. 该代码完全丢失了对递归拆分左半段、右半段（分治递归结构本身都没有在里面提及，只是一个无状态的合并扫瞄模块）。\n综合这两点，仅依靠该段代码完全无法在实质上累算出任何结果。'
  },
  {
    id: 'judgement_6',
    type: 'judgement',
    number: 6,
    questionText: '根据唯⼀分解定理，如果⼤于1的整数不能被任何不超其平⽅根的质数整除，那么 n 必定是质数。',
    correctAnswer: 'Y',
    score: 2,
    knowledgePoints: ['唯一分解定理', '初等数论'],
    explanation: '描述正确。这也是数论判定一个大数是否为质数的“平方根判定法”的根本支撑：\n如果一个数 $n > 1$ 是一个合数，则根据唯一分解定理，其必然可以分解成多个大于等于 2 的质数乘积，例如：$n = p_1 \\times p_2 \\times \\dots \\times p_k$。\n此时这其中最小的一个质因子 $p_{min}$，其平方也必然要满足小于等于 $n$，从而必然成立 $p_{min} \\le \\sqrt{n}$。\n如果已知小于等于 $\\sqrt{n}$ 里的所有可能质数全都无法将 $n$ 正常地整除，这就意味着 $n$ 在非平凡范围内没有任何可以被重组拆分的因数，它只可能是他自身和1，因此它必定是质数。'
  },
  {
    id: 'judgement_7',
    type: 'judgement',
    number: 7,
    questionText: '假设数组 a 的值域范围是 D，以下程序的时间复杂度是 O(n log n + n log D)。',
    codeBlock: `// (参考单选第7题代码: 包含 std::sort(a, a + n) 以及二分查找 ans
// 并在二分中调用单次 check(mid) 函数)
// check(mid) 包含一次长度为 n 的 for 遍历`,
    correctAnswer: 'Y',
    score: 2,
    knowledgePoints: ['算法复杂度的估算 (含多项式、指数、对数复杂度)', '二分查找/二分答案 (也称二分枚举法)', '贪心算法'],
    explanation: '描述正确。这是对该典型贪心二分搜索程序成本的精确概览分析：\n\n1. 算法的第一步是开始对 `a` 执行排布 `std::sort` 这一操作，由于整个序列宽度为 $n$，排序将产生恒定的 $O(n \\log n)$ 代价开销。 \n2. 接下来，我们利用二分查找搜寻间距的最佳解，解空间的上下线被限定在区间 $[0, \\max(a_i) - \\min(a_i)]$。因为值域宽为 $D$，所以二分循环部分一共只会产生大约 $\\log_2 D$ 次判断行为。\n3. 在二分中，每一层独立调用 `check` 去用贪心策略对全局进行一趟前后验证，这个验证需要对 $n$ 的规模做单次循环验证，开销是完美的线性的 $O(n)$。\n把两者相结合，也就是总计算成本由排序和二分两部分组合：$O(n \\log n + n \\log D)$。故结论完全成立。'
  },
  {
    id: 'judgement_8',
    type: 'judgement',
    number: 8,
    questionText: '若一个问题满足最优子结构性质，则一定可以用贪心算法得到最优解。',
    correctAnswer: 'N',
    score: 2,
    knowledgePoints: ['贪心算法'],
    explanation: '描述错误。最优子结构（即大问题的最佳解中蕴含有且可以由其子问题的的最佳解拆分并转移求出）是很多算法如**动态规划（Dynamic Programming）**和贪心算法赖以运作的基础，但它并非贪心的充要保障！\n贪心算法能输出最优界的前提是不仅具备最优子结构，还必须拥有严苛高难度的**“贪心选择性质”**，也就是说通过当期的局部最优解累加，能一路无回头地推进到全局最优解。\n例如 0-1 背包问题就完全具备优秀的最优子结构，但因为物品的完整性约束，用贪心去挑选最优值根本无法提供全局最佳解，本题判断为错，故填 N。'
  },
  {
    id: 'judgement_9',
    type: 'judgement',
    number: 9,
    questionText: '线性筛相比埃氏筛的核心改进在于：埃氏筛中一个合数可能被多个质数重复标记，线性筛通过"每个合数只被其最大质因子筛去"的策略，保证每个合数恰好被标记一次，从而实现 O(n) 的时间复杂度。',
    correctAnswer: 'N',
    score: 2,
    knowledgePoints: ['素数表的埃氏筛法和线性筛法'],
    explanation: '描述错误。这是一道关于数论素数筛选特性的常错考题。\n线性筛选（即著名的欧拉筛）之之所以完成极其优越的 $O(n)$ 时间性能，就在于对于每个数做到了在物理上只会被精确触碰筛选一次。\n但它所依靠的过滤筛除基底并不是“最大质因子”，而是合数必须要由其**“最小质因子”**（Minimum Prime Factor）来去进行对应标记！\n从核心代码中可以看到：通过 `is_composite[i * primes[j]] = true;` 不断遍历并当遇到 `i % primes[j] == 0` 后直接执行终端突围 `break;`，以素数表 `primes` 递增性来确保乘数 `primes[j]` 是复合数的最小素数因子。这句话里的“最大质因子”混淆视听，属于典型错题判定，故填 N。'
  },
  {
    id: 'judgement_10',
    type: 'judgement',
    number: 10,
    questionText: '任何递归程序都可以改写为等价的非递归程序，但改写后的非递归程序一定需要显式地使用栈来模拟递归调用过程。',
    correctAnswer: 'N',
    score: 2,
    knowledgePoints: ['递归'],
    explanation: '描述错误。这是一个常见的教条主义误区：\n1. 虽然递归过程可以用逻辑等价的运行堆栈配合控制流来实现对系统的模拟重写，但绝对不是唯一的手段！\n2. 许多具有直接线性调用的普通递归或首尾相互关联的简单尾递归（Tail Recursion），本身就可以在一维环境下，只靠改写为 `for` / `while` 等最直观、最简单的纯循环控制加上临时储存寄存变量就一键转化运行，压根不用在程序里特意去额外声明或者构造一个形式上的 `std::stack` 数据结构。\n3. 除此以外，对于一些多层或者图型树逻辑结构（比如二叉树遍历），通过如 Morris 遍历算法这类的精巧指针线索编织，也可以完成零堆栈内存耗费下的迭代，因此该“一定需要使用显式栈”说错。'
  },

  // --- Programming Questions ---
  {
    id: 'programming_1',
    type: 'programming',
    number: 1,
    questionText: `### 3.1 编程题 1
**试题名称**：有限不循环小数
**时间限制**：1.0 s
**内存限制**：512.0 MB

#### 3.1.1 题目描述
若 $1 / a$ 可化为一个有限的，不循环的小数，则称 $a$ 为终止数。
请你求出在 $L$ 到 $R$ 中终止数的数量。

#### 3.1.2 输入格式
输入一行，包含两个整数 $L, R$。

#### 3.1.3 输出格式
输出一行，包含一个整数，表示 $L$ 到 $R$ 中终止数的数量。

#### 3.1.4 样例
- **输入样例**：
  \`\`\`text
  2 11
  \`\`\`
- **输出样例**：
  \`\`\`text
  5
  \`\`\`

#### 3.1.5 样例解释
在 $[2, 11]$ 区间内，其终止数有 2、4、5、8、10。其中：
- $1/2 = 0.5$ (有限，是不循环小数)
- $1/4 = 0.25$ (有限)
- $1/5 = 0.2$ (有限)
- $1/8 = 0.125$ (有限)
- $1/10 = 0.1$ (有限)
- 而如 $1/3 = 0.3333...$，$1/7$, $1/9$, $1/11$ 等包含其他质因子的数属于无限循环小数。

#### 3.1.6 数据范围
保证 $1 \\le L \\le R \\le 10^6$。`,
    codeBlock: `#include <iostream>
using namespace std;
int main() {
    int l, r, ans = 0;
    cin >> l >> r;
    for(int i = l; i <= r; i++) {
        int t = i;
        while(t && t % 2 == 0)
            t /= 2;
        while(t && t % 5 == 0)
            t /= 5;
        if(t == 1)
            ans++;
    }
    cout << ans;
    return 0;
}`,
    correctAnswer: ``, // We show the code block directly as sample solution
    score: 25,
    knowledgePoints: ['初等数论'],
    explanation: '一个分数 $1 / a$ 做为最简分数，判定其能否完整转换、化为**有限不循环的十进制小数**，在数论上有且只有一个非常出名的决定性原理：\n该分数分母 $a$ 在消除与分子的最大公约数后（由于本题分子是 1 已经是互质最简），其只可以含有质数因子 2 和 5。若存在任何除了 2、5 以外的任何其它的质因子（如 3, 7 等），在十进制位权倒数分解中，都必定不可避免产生周期的无限循环累加，从而沦为无限循环数。\n\n所以根据这个原理：我们判定 $a$ 的合法性，只需要编写循环：\n1. 不断地将目标数 $a$ 去尝试除以 2，只要偶数能除尽就一直除完；\n2. 同理不断除以 5，除尽即往后退缩；\n3. 如果最后结果经过 2 和 5 的除法化简后正好化简为 1，则这就完美的证明该分母在初始中确实仅仅只含 2 与 5 这两个安全因子。我们将其统计入结果数累加，在 $1 \\le L \\le R \\le 10^6$ 范围中，单数处理只需十几步，总计时间开销约为线性的 $O(R - L)$，能够在 $0.1$ 秒内超爽解决。'
  },
  {
    id: 'programming_2',
    type: 'programming',
    number: 2,
    questionText: `### 3.2 编程题 2
**试题名称**：找数
**时间限制**：1.0 s
**内存限制**：512.0 MB

#### 3.2.1 题目描述
给定一个包含 $n$ 个互不相同的正整数的数组 $A$ 与一个包含 $m$ 个互不相同的正整数的数组 $B$。请你帮忙计算有多少数在数组 $A$ 与 数组 $B$ 中均出现。

#### 3.2.2 输入格式
- 第一行包含两个整数 $n, m$。
- 第二行包含 $n$ 个正整数，表示数组 $A$ 的各项分量。
- 第三行包含 $m$ 个正整数，表示数组 $B$ 的各项分量。

#### 3.2.3 输出格式
输出一个整数，表示在数组 $A$ 与 数组 $B$ 中均出现的数的个数（即交集的大小）。

#### 3.2.4 样例
- **输入样例**：
  \`\`\`text
  3 5
  4 2 3
  3 1 5 4 6
  \`\`\`
- **输出样例**：
  \`\`\`text
  2
  \`\`\`

#### 3.2.5 样例解释
样例1中，数字 4、3 这两个元素在数组 $A$ 与 数组 $B$ 中都出现在列，属于两者的交集。

#### 3.2.6 数据范围
- 对于 40% 的数据，保证 $1 \\le n, m \\le 1000$。
- 对于 100% 的数据，保证 $1 \\le n, m \\le 10^5$，并且元素范围满足 $1 \\le a_i, b_i \\le 10^9$。`,
    codeBlock: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int n, m, l, r, mid;
    bool ok;
    cin >> n >> m;
    vector<int> a(n);
    for(int i = 0; i < n; i++)
        cin >> a[i];
    sort(a.begin(), a.end());
    int ans = 0;
    for(int i = 0, b; i < m; i++) {
        cin >> b;
        ok = false;
        l = 0;
        r = n-1;
        while(l <= r)
        {
            mid = l + (r-l)/2;
            if(a[mid] > b) r = mid - 1;
            else if(a[mid] < b) l = mid + 1;
            else
            {
                ok = true;
                break;
            }
        }
        if(ok) ans++;
    }
    cout << ans;
    return 0;
}`,
    correctAnswer: ``,
    score: 25,
    knowledgePoints: ['二分查找/二分答案 (也称二分枚举法)'],
    explanation: '本题需要寻找两个大集合的公共交集项件数。由于 $n, m \\le 10^5$：\n1. 如果采用普通不经脑子的对等嵌套双指针查找（即对每一个 $B_j$，都从头到尾扫一遍 $A$），其总复杂度将达到糟糕的 $O(n \\times m) = 10^{10}$ 次比较，这对 $1.0$ 秒时限必定超负荷直接超时 (TLE)；\n2. **二分演练方案**：由于数组 $A$ 内数字都是完全独特的且互不相同。我们可以首先对 $A$ 数组进行升序排序 `std::sort`（时间耗费 $O(n \\log n)$）。之后，我们开启 $m$ 次检索循环。对每一个输入的 $B_j$ 元素，我们通过二分查找 `Binary Search` 在已经有序的 $A$ 中搜寻：这一步每轮比较仅需耗费 $\\log_2 n$。由此，找数匹配在 $O((n+m) \\log n)$ 完成，整体时间远远小于 10^7 次运算，可以在 50 毫秒内顺利拿到满分。'
  }
];
