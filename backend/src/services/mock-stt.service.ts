import { Injectable } from '@nestjs/common'
import { MeetingLanguage } from '../database/entities/meeting.entity'

const MN_PHRASES = [
  'Өнөөдрийн хурлыг эхлүүлье.',
  'Энэ асуудлыг шийдвэрлэх хэрэгтэй байна.',
  'Манай багийн гүйцэтгэл сайжирч байна.',
  'Дараагийн алхамуудаа тодорхойлцгооё.',
  'Санхүүгийн тайланг хэлэлцэх хэрэгтэй.',
  'Шинэ төслийг эхлүүлэх боломжтой юу?',
  'Хугацааг яаралтай тогтоох хэрэгтэй.',
  'Үйлчлүүлэгчдийн санал хүсэлтийг авч үзье.',
  'Техникийн асуудлыг шийдэж чадаж байна уу?',
  'Маркетингийн стратегиа шинэчилье.',
  'Дараагийн улирлын зорилтуудаа тавицгааж.',
  'Баг хоорондын харилцааг сайжруулах хэрэгтэй.',
  'Энэ төлөвлөгөөг зөвшөөрч байна.',
  'Нэмэлт санхүүжилт хэрэгтэй байж магадгүй.',
  'Хэрэглэгчдийн туршлагыг сайжруулах чиглэлд ажиллана.',
]

const EN_PHRASES = [
  'Let\'s get started with today\'s agenda.',
  'I think we need to address this issue urgently.',
  'Our team has made great progress this quarter.',
  'Let\'s align on the next steps before we close.',
  'The financial projections look promising.',
  'Can we kick off the new project next month?',
  'We need to set a firm deadline for this deliverable.',
  'Customer feedback has been largely positive.',
  'The technical team is working through the blockers.',
  'Our marketing strategy needs a refresh.',
  'Let\'s set our Q3 targets today.',
  'Cross-team communication needs improvement.',
  'I agree with this approach and want to move forward.',
  'We may need additional budget allocation.',
  'User experience should be our north star.',
]

interface SpeakerTurn {
  speaker: string
  start: number
  end: number
  text: string
}

@Injectable()
export class MockSttService {
  transcribe(
    language: MeetingLanguage,
    participants: string[],
  ): { full_text: string; speaker_turns: SpeakerTurn[]; speaker_count: number } {
    const phrases = language === MeetingLanguage.EN ? EN_PHRASES : MN_PHRASES
    const speakers = participants.length
      ? participants.slice(0, 3)
      : ['Speaker 1', 'Speaker 2', 'Speaker 3']

    const turns: SpeakerTurn[] = []
    let cursor = 0
    const count = 18 + Math.floor(Math.random() * 10)

    for (let i = 0; i < count; i++) {
      const speaker = speakers[i % speakers.length]
      const phrase = phrases[Math.floor(Math.random() * phrases.length)]
      const duration = 4 + Math.floor(Math.random() * 8)
      turns.push({
        speaker,
        start: cursor,
        end: cursor + duration,
        text: phrase,
      })
      cursor += duration + 1
    }

    const full_text = turns.map((t) => `[${t.speaker}]: ${t.text}`).join('\n')

    return {
      full_text,
      speaker_turns: turns,
      speaker_count: speakers.length,
    }
  }
}
