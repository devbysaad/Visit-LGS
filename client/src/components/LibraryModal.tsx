import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MenuBookIcon from '@mui/icons-material/MenuBook'

import { useAppDispatch, useAppSelector } from '../hooks'
import { closeBuilding } from '../stores/BuildingStore'
import { getBuildingById } from '../content/buildings'
import { libraryBooks, getLibraryBookById } from '../content/books'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 16, 28, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 410;
`

const Panel = styled.div`
  width: 560px;
  max-width: 92vw;
  max-height: 88vh;
  overflow-y: auto;
  background: #123338;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  border: 1px solid #fde68a55;
  position: relative;
`

const Content = styled.div`
  padding: 24px 28px 28px;
`

const CloseButton = styled(IconButton)`
  position: absolute !important;
  top: 12px;
  right: 12px;
  color: #eee !important;
  z-index: 2;
`

const Name = styled.h2`
  margin: 0 0 4px;
  color: #eef1f6;
  font-size: 22px;
  padding-right: 36px;
`

const Tagline = styled.p`
  margin: 0 0 12px;
  color: #fb7185;
  font-size: 14px;
  font-weight: 600;
`

const Description = styled.p`
  margin: 0 0 20px;
  color: #c2c2c2;
  font-size: 15px;
  line-height: 1.5;
`

const SectionLabel = styled.h3`
  margin: 0 0 12px;
  color: #eef1f6;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: #fb7185;
    font-size: 20px;
  }
`

const BookList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const BookRow = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #ffffff1a;
  background: #1a4a50;
  color: #eef1f6;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #fb7185;
    background: #353a5c;
  }

  strong {
    font-size: 15px;
  }

  span {
    font-size: 12px;
    color: #9aa3b8;
  }

  em {
    font-size: 13px;
    color: #c2c2c2;
    font-style: normal;
  }
`

const Hint = styled.p`
  margin: 16px 0 0;
  color: #9aa3b8;
  font-size: 12px;
`

const BookShell = styled.div`
  margin-top: 8px;
  border-radius: 4px 12px 12px 4px;
  background: linear-gradient(90deg, #5c3d2e 0 14px, #f4ecd8 14px);
  box-shadow: inset 14px 0 0 #4a3124, 0 8px 24px rgba(0, 0, 0, 0.35);
  min-height: 320px;
  padding: 20px 24px 16px 32px;
  color: #2a2418;
`

const BookTitle = styled.h3`
  margin: 0 0 4px;
  font-size: 18px;
  color: #1f1a12;
`

const BookAuthor = styled.p`
  margin: 0 0 16px;
  font-size: 13px;
  color: #6b5e4a;
`

const PageText = styled.p`
  margin: 0;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.55;
  min-height: 180px;
`

const PageNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  gap: 12px;
`

const NavButton = styled.button<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #fb7185;
  background: ${(p) => (p.disabled ? '#1a4a5055' : '#fb7185')};
  color: ${(p) => (p.disabled ? '#9aa3b8' : '#0e101c')};
  font-weight: 600;
  font-size: 13px;
  cursor: ${(p) => (p.disabled ? 'default' : 'pointer')};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
`

const PageLabel = styled.span`
  color: #6b5e4a;
  font-size: 13px;
`

const BackRow = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  padding: 0;
  border: none;
  background: none;
  color: #fb7185;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`

export default function LibraryModal() {
  const dispatch = useAppDispatch()
  const modalOpen = useAppSelector((state) => state.building.modalOpen)
  const selectedBuildingId = useAppSelector((state) => state.building.selectedBuildingId)
  const [openBookId, setOpenBookId] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)

  const isLibrary = modalOpen && selectedBuildingId === 'library'
  const building = getBuildingById('library')
  const openBook = openBookId ? getLibraryBookById(openBookId) : undefined
  const pageCount = openBook?.pages.length ?? 0

  useEffect(() => {
    if (!isLibrary) {
      setOpenBookId(null)
      setPageIndex(0)
    }
  }, [isLibrary])

  useEffect(() => {
    setPageIndex(0)
  }, [openBookId])

  useEffect(() => {
    if (!isLibrary) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (openBookId) {
          setOpenBookId(null)
        } else {
          dispatch(closeBuilding())
        }
        return
      }
      if (!openBook) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        setPageIndex((i) => Math.min(i + 1, openBook.pages.length - 1))
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        setPageIndex((i) => Math.max(i - 1, 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLibrary, openBookId, openBook, dispatch])

  if (!isLibrary || !building) return null

  return (
    <Backdrop onClick={() => dispatch(closeBuilding())}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <CloseButton aria-label="close" onClick={() => dispatch(closeBuilding())} size="small">
          <CloseIcon />
        </CloseButton>
        <Content>
          {openBook ? (
            <>
              <BackRow type="button" onClick={() => setOpenBookId(null)}>
                <ArrowBackIcon fontSize="small" />
                Back to shelf
              </BackRow>
              <BookShell>
                <BookTitle>{openBook.title}</BookTitle>
                <BookAuthor>{openBook.author}</BookAuthor>
                <PageText>{openBook.pages[pageIndex]}</PageText>
                <PageNav>
                  <NavButton
                    type="button"
                    disabled={pageIndex <= 0}
                    onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  >
                    <ChevronLeftIcon fontSize="small" />
                    Back page
                  </NavButton>
                  <PageLabel>
                    Page {pageIndex + 1} / {pageCount}
                  </PageLabel>
                  <NavButton
                    type="button"
                    disabled={pageIndex >= pageCount - 1}
                    onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
                  >
                    Next page
                    <ChevronRightIcon fontSize="small" />
                  </NavButton>
                </PageNav>
              </BookShell>
              <Hint>Arrow keys turn pages · Esc returns to the shelf</Hint>
            </>
          ) : (
            <>
              <Name>{building.name}</Name>
              <Tagline>{building.tagline}</Tagline>
              <Description>{building.description}</Description>
              <SectionLabel>
                <MenuBookIcon />
                Browse the shelf — press a book to read
              </SectionLabel>
              <BookList>
                {libraryBooks.map((book) => (
                  <li key={book.id}>
                    <BookRow type="button" onClick={() => setOpenBookId(book.id)}>
                      <strong>{book.title}</strong>
                      <span>{book.author}</span>
                      <em>{book.blurb}</em>
                    </BookRow>
                  </li>
                ))}
              </BookList>
              <Hint>
                Tip — ask: {building.whoToAsk}. Esc closes.
              </Hint>
            </>
          )}
        </Content>
      </Panel>
    </Backdrop>
  )
}
